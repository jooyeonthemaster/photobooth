using System;
using System.Drawing;
using System.Drawing.Drawing2D;
using System.Drawing.Printing;
using System.IO;
using System.Runtime.InteropServices;

namespace DnpPrinterService
{
    class Program
    {
        static Image RotateImage(Image img, float angle)
        {
            // 새 이미지 크기 계산 (90도 회전이므로 width와 height 교체)
            Bitmap rotatedImage = new Bitmap(img.Height, img.Width);

            using (Graphics g = Graphics.FromImage(rotatedImage))
            {
                // 고품질 렌더링
                g.InterpolationMode = InterpolationMode.HighQualityBicubic;
                g.CompositingQuality = CompositingQuality.HighQuality;
                g.SmoothingMode = SmoothingMode.HighQuality;

                // 중심점으로 이동
                g.TranslateTransform(rotatedImage.Width / 2, rotatedImage.Height / 2);
                // 회전
                g.RotateTransform(angle);
                // 이미지 그리기
                g.TranslateTransform(-img.Width / 2, -img.Height / 2);
                g.DrawImage(img, 0, 0);
            }

            return rotatedImage;
        }

        static void Main(string[] args)
        {
            if (args.Length < 1)
            {
                Console.WriteLine("Usage: DnpPrinter.exe <image_path>");
                Environment.Exit(1);
            }

            string imagePath = args[0];

            if (!File.Exists(imagePath))
            {
                Console.WriteLine("Error: File not found - " + imagePath);
                Environment.Exit(1);
            }

            try
            {
                PrintImage(imagePath);
                Console.WriteLine("Print job sent successfully");
                Environment.Exit(0);
            }
            catch (Exception ex)
            {
                Console.WriteLine("Error: " + ex.Message);
                Environment.Exit(1);
            }
        }

        static void PrintImage(string imagePath)
        {
            // DNP DS620 프린터 이름
            string printerName = "DP-DS620";

            // 이미지 로드
            Image image = Image.FromFile(imagePath);

            // 이미지 크기 확인
            Console.WriteLine("=== 입력 이미지 정보 ===");
            Console.WriteLine("이미지 크기: " + image.Width + " x " + image.Height);
            Console.WriteLine("이미지 비율: " + ((float)image.Width / image.Height).ToString("F2"));

            // PrintDocument 생성
            PrintDocument pd = new PrintDocument();
            pd.PrinterSettings.PrinterName = printerName;

            // 여백 제거
            pd.DefaultPageSettings.Margins = new Margins(0, 0, 0, 0);

            // Landscape 모드 설정 (윈도우 이미지 편집기와 동일)
            pd.DefaultPageSettings.Landscape = true;

            Console.WriteLine("=== 프린터 설정 ===");
            Console.WriteLine("용지 크기: " + pd.DefaultPageSettings.PaperSize.PaperName);
            Console.WriteLine("PaperSize: " + pd.DefaultPageSettings.PaperSize.Width + " x " + pd.DefaultPageSettings.PaperSize.Height);
            Console.WriteLine("Landscape: " + pd.DefaultPageSettings.Landscape);

            // 프린터 존재 확인
            bool printerExists = false;
            foreach (string printer in PrinterSettings.InstalledPrinters)
            {
                if (printer == printerName)
                {
                    printerExists = true;
                    break;
                }
            }

            if (!printerExists)
            {
                throw new Exception("Printer '" + printerName + "' not found");
            }

            // 인쇄 이벤트 핸들러
            pd.PrintPage += (sender, e) =>
            {
                Console.WriteLine("=== 출력 시작 ===");
                Console.WriteLine("PageBounds: " + e.PageBounds.Width + " x " + e.PageBounds.Height);

                // 고품질 렌더링 설정
                e.Graphics.InterpolationMode = InterpolationMode.HighQualityBicubic;
                e.Graphics.CompositingQuality = CompositingQuality.HighQuality;
                e.Graphics.SmoothingMode = SmoothingMode.HighQuality;

                // 이미지를 PageBounds 전체에 그대로 출력 (회전 없음, 크롭 없음)
                e.Graphics.DrawImage(image, e.PageBounds);

                Console.WriteLine("이미지 출력 완료");
                e.HasMorePages = false;
            };

            // 인쇄 실행
            pd.Print();

            // 이미지 리소스 해제
            image.Dispose();
        }
    }
}
