import fs from 'fs'
import { PDFDocument, rgb } from 'pdf-lib'

async function divideDoublePagePDF(inputPath: string, outputPath: string) {
  // 入力PDFの読み込み
  const inputBytes = fs.readFileSync(inputPath)
  const inputPdf = await PDFDocument.load(inputBytes)

  // 　全てのページの幅を取得
  const pageWidths = inputPdf.getPages().map((page) => page.getSize().width)

  // ページの最大幅・最小幅
  const maxWidth = Math.max(...pageWidths)
  const minWidth = Math.min(...pageWidths)
  console.log(`Max Width: ${maxWidth}, Min Width: ${minWidth}`)

  // 新しいPDFの作成
  const outputPdf = await PDFDocument.create()

  // 入力PDFを分割して出力用のストリームに書き込む処理
  for (let i = 0; i < inputPdf.getPageCount(); i++) {
    // ページサイズを取得
    const page = inputPdf.getPage(i)
    const { width, height } = page.getSize()

    // ページが1ページ分のサイズの時、分割しない
    if (width / height < 1.3) {
      // 一般的な1ページの比率は概ね1:√2 (≈1.414)
      console.log(
        `Single page detected for page ${i + 1} (width: ${width}, height: ${height}, ratio: ${(width / height).toFixed(2)})`,
      )
      const copiedPage = await outputPdf.copyPages(inputPdf, [i])
      outputPdf.addPage(copiedPage[0])
      continue
    }

    // ページを埋め込んでから描画
    const [embeddedPage] = await outputPdf.embedPages([page])

    // 右ページを作成
    const rightPage = outputPdf.addPage([width / 2, height])
    rightPage.drawPage(embeddedPage, {
      x: -width / 2,
      y: 0,
      width,
      height,
    })

    // 左ページを作成
    const leftPage = outputPdf.addPage([width / 2, height])
    leftPage.drawPage(embeddedPage, {
      x: 0,
      y: 0,
      width,
      height,
    })
  }

  // 新しいPDFの保存
  const pdfBytes = await outputPdf.save()
  fs.writeFileSync(outputPath, pdfBytes)
}

divideDoublePagePDF('./before/a.pdf', './after/b.pdf').catch(console.error)
