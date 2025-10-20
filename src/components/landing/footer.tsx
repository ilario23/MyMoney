import { Github, Twitter, Linkedin } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-neutral-200 bg-neutral-50 py-12">
      <div className="container max-w-screen-2xl">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg"></div>
              <span className="font-bold">ActiveFitness</span>
            </div>
            <p className="text-sm text-neutral-600">
              Your personal fitness companion for achieving your goals.
            </p>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Product</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="text-neutral-600 hover:text-blue-600 transition">Features</a></li>
              <li><a href="#" className="text-neutral-600 hover:text-blue-600 transition">Pricing</a></li>
              <li><a href="#" className="text-neutral-600 hover:text-blue-600 transition">Security</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Company</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="text-neutral-600 hover:text-blue-600 transition">About</a></li>
              <li><a href="#" className="text-neutral-600 hover:text-blue-600 transition">Blog</a></li>
              <li><a href="#" className="text-neutral-600 hover:text-blue-600 transition">Careers</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Legal</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="text-neutral-600 hover:text-blue-600 transition">Privacy</a></li>
              <li><a href="#" className="text-neutral-600 hover:text-blue-600 transition">Terms</a></li>
              <li><a href="#" className="text-neutral-600 hover:text-blue-600 transition">Contact</a></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-neutral-200 pt-8 flex flex-col md:flex-row items-center justify-between">
          <p className="text-sm text-neutral-600">
            © 2024 ActiveFitness. All rights reserved.
          </p>
          <div className="flex gap-4 mt-4 md:mt-0">
            <a href="#" className="text-neutral-600 hover:text-blue-600 transition">
              <Twitter className="w-5 h-5" />
            </a>
            <a href="#" className="text-neutral-600 hover:text-blue-600 transition">
              <Github className="w-5 h-5" />
            </a>
            <a href="#" className="text-neutral-600 hover:text-blue-600 transition">
              <Linkedin className="w-5 h-5" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
