import { Document, Packer, Paragraph, TextRun, HeadingLevel } from "docx";
import { PDFDocument as PDFLibDocument, StandardFonts, rgb } from "pdf-lib";

interface TextSegment {
  text: string;
  bold?: boolean;
  italic?: boolean;
  code?: boolean;
}

interface ParsedBlock {
  type: "heading1" | "heading2" | "heading3" | "paragraph" | "empty";
  runs: TextSegment[];
}

function parseInline(text: string): TextSegment[] {
  const regex = /(\*\*(.+?)\*\*|\*(.+?)\*|`(.+?)`)/g;
  const segments: TextSegment[] = [];
  let lastIdx = 0;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIdx) {
      segments.push({ text: text.slice(lastIdx, match.index) });
    }
    if (match[2]) segments.push({ text: match[2], bold: true });
    else if (match[3]) segments.push({ text: match[3], italic: true });
    else if (match[4]) segments.push({ text: match[4], code: true });
    lastIdx = match.index + match[0].length;
  }
  if (lastIdx < text.length) {
    segments.push({ text: text.slice(lastIdx) });
  }
  return segments;
}

export function parseMarkdown(content: string): ParsedBlock[] {
  const blocks: ParsedBlock[] = [];
  const lines = content.split("\n");
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      blocks.push({ type: "empty", runs: [] });
      continue;
    }
    const headingMatch = trimmed.match(/^(#{1,3})\s+(.+)/);
    if (headingMatch) {
      const level = headingMatch[1].length;
      const type = level === 1 ? "heading1" : level === 2 ? "heading2" : "heading3";
      blocks.push({ type, runs: parseInline(headingMatch[2]) });
      continue;
    }
    blocks.push({ type: "paragraph", runs: parseInline(trimmed) });
  }
  return blocks;
}

function segmentsToDocxRuns(segments: TextSegment[]): TextRun[] {
  if (segments.length === 0) return [new TextRun("")];
  return segments.map((s) => {
    if (s.code) return new TextRun({ text: s.text, font: "Courier New" });
    return new TextRun({ text: s.text, bold: s.bold, italics: s.italic });
  });
}

export async function generateDocx(title: string, content: string): Promise<Buffer> {
  const blocks = parseMarkdown(content);
  const children: Paragraph[] = [];

  if (title) {
    children.push(new Paragraph({ text: title, heading: HeadingLevel.TITLE }));
  }

  for (const block of blocks) {
    if (block.type === "empty") {
      children.push(new Paragraph({}));
      continue;
    }
    if (block.type === "heading1") {
      children.push(new Paragraph({ children: segmentsToDocxRuns(block.runs), heading: HeadingLevel.HEADING_1 }));
    } else if (block.type === "heading2") {
      children.push(new Paragraph({ children: segmentsToDocxRuns(block.runs), heading: HeadingLevel.HEADING_2 }));
    } else if (block.type === "heading3") {
      children.push(new Paragraph({ children: segmentsToDocxRuns(block.runs), heading: HeadingLevel.HEADING_3 }));
    } else {
      children.push(new Paragraph({ children: segmentsToDocxRuns(block.runs) }));
    }
  }

  const doc = new Document({ sections: [{ children }] });
  const buffer = await Packer.toBuffer(doc);
  return Buffer.from(buffer);
}

const MARGIN = 50;
const PAGE_WIDTH = 612;
const PAGE_HEIGHT = 792;
const MAX_WIDTH = PAGE_WIDTH - MARGIN * 2;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function wrapText(text: string, font: any, fontSize: number): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    const test = current ? `${current} ${word}` : word;
    if (font.widthOfTextAtSize(test, fontSize) > MAX_WIDTH) {
      lines.push(current);
      current = word;
    } else {
      current = test;
    }
  }
  if (current) lines.push(current);
  return lines;
}

export async function generatePdf(title: string, content: string): Promise<Uint8Array> {
  const doc = await PDFLibDocument.create();
  let page = doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  let y = PAGE_HEIGHT - MARGIN;

  const font = await doc.embedFont(StandardFonts.Helvetica);
  const boldFont = await doc.embedFont(StandardFonts.HelveticaBold);

  function addLine(text: string, f: typeof font, size: number) {
    const lines = wrapText(text, f, size);
    for (const line of lines) {
      if (y - size < MARGIN + size) {
        page = doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
        y = PAGE_HEIGHT - MARGIN;
      }
      page.drawText(line, { x: MARGIN, y: y - size, font: f, size, color: rgb(0, 0, 0) });
      y -= size + 4;
    }
  }

  if (title) {
    addLine(title, boldFont, 22);
    y -= 8;
  }

  const lines = content.split("\n");
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      y -= 8;
      continue;
    }
    const heading = trimmed.match(/^(#{1,3})\s+(.+)/);
    if (heading) {
      const level = heading[1].length;
      const size = level === 1 ? 18 : level === 2 ? 15 : 13;
      addLine(heading[2], boldFont, size);
      y -= 4;
    } else {
      addLine(trimmed, font, 11);
    }
  }

  return doc.save();
}
