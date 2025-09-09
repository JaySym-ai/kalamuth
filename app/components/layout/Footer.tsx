import Logo from "../ui/Logo";

const footerLinks = {
  Game: ["Features", "Gladiators", "Battle System", "Ludus Wars", "City Markets"],
  Community: ["Discord", "Forums", "Reddit", "Twitter", "YouTube"],
  Resources: ["Game Guide", "Combat Manual", "API Docs", "Patch Notes", "Roadmap"],
  Company: ["About", "Careers", "Press Kit", "Contact", "Legal"],
};

export default function Footer() {
  return (
    <footer className="relative bg-black border-t border-amber-900/20">
      {/* Background Effect */}
      <div className="absolute inset-0 bg-gradient-to-b from-red-950/10 to-black" />
      
      <div className="relative z-10 container mx-auto px-6 py-12">
        {/* Top Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 mb-12">
          {/* Logo & Description */}
          <div className="lg:col-span-1">
            <Logo />
            <p className="mt-4 text-gray-400 text-sm leading-relaxed">
              Forge your legend in the ultimate gladiator management simulation.
            </p>
            <div className="flex gap-4 mt-6">
              {["🐦", "💬", "📺", "🎮"].map((icon, index) => (
                <button
                  key={index}
                  className="w-10 h-10 bg-amber-900/20 border border-amber-700/30 rounded-lg flex items-center justify-center hover:bg-amber-900/30 hover:border-amber-600 transition-all duration-200 hover:scale-110"
                >
                  <span className="text-lg">{icon}</span>
                </button>
              ))}
            </div>
          </div>
          
          {/* Links */}
          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <h3 className="text-amber-400 font-bold mb-4">{category}</h3>
              <ul className="space-y-2">
                {links.map((link) => (
                  <li key={link}>
                    <a
                      href="#"
                      className="text-gray-400 hover:text-amber-400 text-sm transition-colors duration-200"
                    >
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        
        {/* Divider */}
        <div className="border-t border-amber-900/20 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            {/* Copyright */}
            <p className="text-gray-500 text-sm">
              © 2024 Kalamuth. All rights reserved. Glory awaits the brave.
            </p>
            
            {/* Legal Links */}
            <div className="flex gap-6">
              <a href="#" className="text-gray-500 hover:text-amber-400 text-sm transition-colors">
                Privacy Policy
              </a>
              <a href="#" className="text-gray-500 hover:text-amber-400 text-sm transition-colors">
                Terms of Service
              </a>
              <a href="#" className="text-gray-500 hover:text-amber-400 text-sm transition-colors">
                Cookie Policy
              </a>
            </div>
          </div>
        </div>
        
        {/* Easter Egg */}
        <div className="mt-8 text-center">
          <p className="text-gray-700 text-xs italic">
            "Ave, Imperator, morituri te salutant" - Those who are about to die salute you
          </p>
        </div>
      </div>
    </footer>
  );
}
