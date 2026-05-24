import Link from 'next/link'
import './globals.css'

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="container mx-auto px-4 py-6">
        <nav className="flex justify-between items-center">
          <div className="text-2xl font-bold text-indigo-600">YourBrand</div>
          <div className="space-x-6">
            <a href="#features" className="text-gray-700 hover:text-indigo-600">Features</a>
            <a href="#pricing" className="text-gray-700 hover:text-indigo-600">Pricing</a>
            <a href="#contact" className="text-gray-700 hover:text-indigo-600">Contact</a>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
          Build Amazing Products
        </h1>
        <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
          Transform your ideas into reality with our powerful platform. 
          Simple, fast, and effective.
        </p>
        <div className="space-x-4">
          <button className="bg-indigo-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-indigo-700 transition">
            Get Started Free
          </button>
          <button className="border-2 border-indigo-600 text-indigo-600 px-8 py-3 rounded-lg font-semibold hover:bg-indigo-50 transition">
            Watch Demo
          </button>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="container mx-auto px-4 py-20">
        <h2 className="text-4xl font-bold text-center mb-12">Features</h2>
        <div className="grid md:grid-cols-3 gap-8">
          <FeatureCard 
            icon="⚡" 
            title="Lightning Fast" 
            description="Optimized for speed and performance"
          />
          <FeatureCard 
            icon="🔒" 
            title="Secure" 
            description="Enterprise-grade security built-in"
          />
          <FeatureCard 
            icon="📱" 
            title="Responsive" 
            description="Works perfectly on any device"
          />
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="container mx-auto px-4 py-20 bg-white rounded-2xl shadow-lg">
        <h2 className="text-4xl font-bold text-center mb-12">Simple Pricing</h2>
        <div className="grid md:grid-cols-3 gap-8">
          <PricingCard 
            name="Starter" 
            price="" 
            features={['10 Projects', '5GB Storage', 'Basic Support']}
          />
          <PricingCard 
            name="Pro" 
            price="9" 
            features={['Unlimited Projects', '100GB Storage', 'Priority Support', 'Advanced Analytics']}
            featured
          />
          <PricingCard 
            name="Enterprise" 
            price="9" 
            features={['Everything in Pro', 'Custom Integrations', 'Dedicated Support', 'SLA Guarantee']}
          />
        </div>
      </section>

      {/* CTA */}
      <section id="contact" className="container mx-auto px-4 py-20 text-center">
        <h2 className="text-4xl font-bold mb-6">Ready to get started?</h2>
        <p className="text-xl text-gray-600 mb-8">Join thousands of happy customers</p>
        <button className="bg-indigo-600 text-white px-12 py-4 rounded-lg font-semibold text-lg hover:bg-indigo-700 transition">
          Start Free Trial
        </button>
      </section>

      {/* Footer */}
      <footer className="container mx-auto px-4 py-8 text-center text-gray-600 border-t">
        <p>© 2024 YourBrand. All rights reserved.</p>
      </footer>
    </div>
  )
}

function FeatureCard({ icon, title, description }: { icon: string; title: string; description: string }) {
  return (
    <div className="bg-white p-8 rounded-xl shadow-md text-center hover:shadow-xl transition">
      <div className="text-5xl mb-4">{icon}</div>
      <h3 className="text-2xl font-bold mb-2">{title}</h3>
      <p className="text-gray-600">{description}</p>
    </div>
  )
}

function PricingCard({ name, price, features, featured }: { 
  name: string; 
  price: string; 
  features: string[]; 
  featured?: boolean 
}) {
  return (
    <div className={`p-8 rounded-xl ${featured ? 'bg-indigo-600 text-white shadow-2xl scale-105' : 'bg-gray-50'}`}>
      <h3 className="text-2xl font-bold mb-2">{name}</h3>
      <div className="text-4xl font-bold mb-6">{price}<span className="text-lg">/mo</span></div>
      <ul className="space-y-3 mb-8">
        {features.map((feature, i) => (
          <li key={i} className="flex items-center">
            <span className="mr-2">✓</span> {feature}
          </li>
        ))}
      </ul>
      <button className={`w-full py-3 rounded-lg font-semibold ${
        featured 
          ? 'bg-white text-indigo-600 hover:bg-gray-100' 
          : 'bg-indigo-600 text-white hover:bg-indigo-700'
      } transition`}>
        Get Started
      </button>
    </div>
  )
}
