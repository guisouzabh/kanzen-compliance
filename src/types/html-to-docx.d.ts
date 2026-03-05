declare module 'html-to-docx' {
  type DocxOptions = {
    table?: {
      row?: {
        cantSplit?: boolean;
      };
    };
  };

  export default function HTMLtoDOCX(
    htmlString: string,
    headerHTMLString?: string | null,
    documentOptions?: DocxOptions
  ): Promise<Buffer>;
}
