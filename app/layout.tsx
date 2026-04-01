import "./globals.css";
import BackHandler from "./back-handler";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col">

        {/* 🔥 BACK HANDLER */}
        <BackHandler />

        {/* MAIN */}
        <div className="flex-1">{children}</div>

        {/* FOOTER */}
        <footer className="text-center text-sm text-gray-400 py-4 border-t border-gray-700">
          <p>© {new Date().getFullYear()} TitanArtStudio</p>

          <div className="flex justify-center gap-4 mt-2">
            <a
              href="https://titanartstudio.in/privacy-policy"
              target="_blank"
              className="hover:underline"
            >
              Privacy Policy
            </a>

            <a
              href="https://titanartstudio.in/terms-and-conditions"
              target="_blank"
              className="hover:underline"
            >
              Terms
            </a>
          </div>
        </footer>

      </body>
    </html>
  );
}