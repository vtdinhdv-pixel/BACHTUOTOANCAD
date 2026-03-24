import { Document, Packer, Paragraph, TextRun, HeadingLevel } from "docx";
import { saveAs } from "file-saver";
import { Message } from "../types";

export async function exportToDocx(messages: Message[], studentName: string) {
  const doc = new Document({
    sections: [
      {
        properties: {},
        children: [
          new Paragraph({
            text: "BẠCH TUỘC TOÁN VUI - BÀI HỌC CỦA EM",
            heading: HeadingLevel.HEADING_1,
            alignment: "center",
          }),
          new Paragraph({
            text: `Học sinh: ${studentName}`,
            alignment: "center",
          }),
          new Paragraph({
            text: `Ngày: ${new Date().toLocaleDateString("vi-VN")}`,
            alignment: "center",
          }),
          new Paragraph({ text: "" }), // Spacer

          ...messages.flatMap((msg) => [
            new Paragraph({
              children: [
                new TextRun({
                  text: msg.role === "user" ? "Học sinh: " : msg.role === "teacher" ? "Thầy cô: " : "Bạch Tuộc: ",
                  bold: true,
                  color: msg.role === "user" ? "FF0000" : "0000FF",
                }),
                new TextRun(msg.content),
              ],
            }),
            new Paragraph({ text: "" }), // Spacer
          ]),

          new Paragraph({
            text: "--- Hết bài học ---",
            alignment: "center",
          }),
        ],
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  saveAs(blob, `Bai-Hoc-Toan-${studentName}-${Date.now()}.docx`);
}
