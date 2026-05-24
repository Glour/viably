import './globals.css'

const projects = [
  {
    title: 'E-Commerce Platform',
    description: 'Full-stack online store with payment integration',
    tech: ['Next.js', 'Stripe', 'PostgreSQL'],
    link: 'https://github.com/yourusername/project1'
  },
  {
    title: 'Task Management App',
    description: 'Collaborative task tracker with real-time updates',
    tech: ['React', 'Firebase', 'Tailwind'],
    link: 'https://github.com/yourusername/project2'
  },
  {
    title: 'Weather Dashboard',
    description: 'Beautiful weather app with forecasts and maps',
    tech: ['TypeScript', 'OpenWeather API', 'Charts.js'],
    link: 'https://github.com/yourusername/project3'
  }
]

const skills = [
  { category: 'Frontend', items: ['React', 'Next.js', 'TypeScript', 'Tailwind CSS'] },
  { category: 'Backend', items: ['Node.js', 'Python', 'PostgreSQL', 'MongoDB'] },
  { category: 'Tools', items: ['Git', 'Docker', 'Vercel', 'AWS'] }
]

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white">
      {/* Hero */}
      <section className="container mx-auto px-4 py-20 text-center">
        <div className="mb-8">
          <div className="w-32 h-32 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full mx-auto mb-6 flex items-center justify-center text-4xl font-bold">
            JD
          </div>
        </div>
        <h1 className="text-5xl md:text-7xl font-bold mb-4">John Doe</h1>
        <p className="text-xl md:text-2xl text-gray-300 mb-8">
          Full-Stack Developer & Designer
        </p>
        <div className="flex gap-4 justify-center">
          <a href="#projects" className="bg-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition">
            View Work
          </a>
          <a href="#contact" className="border-2 border-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-black transition">
            Contact Me
          </a>
        </div>
      </section>

      {/* About */}
      <section className="container mx-auto px-4 py-16">
        <h2 className="text-4xl font-bold mb-8 text-center">About Me</h2>
        <div className="max-w-3xl mx-auto bg-gray-800 rounded-xl p-8">
          <p className="text-lg text-gray-300 leading-relaxed">
            I'm a passionate developer with 5+ years of experience building web applications.
            I love creating beautiful, functional products that solve real problems.
            When I'm not coding, you'll find me exploring new technologies or contributing to open source.
          </p>
        </div>
      </section>

      {/* Skills */}
      <section className="container mx-auto px-4 py-16">
        <h2 className="text-4xl font-bold mb-12 text-center">Skills</h2>
        <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          {skills.map((skillSet) => (
            <div key={skillSet.category} className="bg-gray-800 rounded-xl p-6">
              <h3 className="text-2xl font-bold mb-4 text-blue-400">{skillSet.category}</h3>
              <ul className="space-y-2">
                {skillSet.items.map((skill) => (
                  <li key={skill} className="text-gray-300">• {skill}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* Projects */}
      <section id="projects" className="container mx-auto px-4 py-16">
        <h2 className="text-4xl font-bold mb-12 text-center">Projects</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {projects.map((project) => (
            <div key={project.title} className="bg-gray-800 rounded-xl p-6 hover:bg-gray-750 transition">
              <h3 className="text-2xl font-bold mb-3">{project.title}</h3>
              <p className="text-gray-300 mb-4">{project.description}</p>
              <div className="flex flex-wrap gap-2 mb-4">
                {project.tech.map((tech) => (
                  <span key={tech} className="bg-blue-900 text-blue-200 px-3 py-1 rounded-full text-sm">
                    {tech}
                  </span>
                ))}
              </div>
              <a 
                href={project.link} 
                className="text-blue-400 hover:text-blue-300 font-semibold"
                target="_blank"
                rel="noopener noreferrer"
              >
                View Project →
              </a>
            </div>
          ))}
        </div>
      </section>

      {/* Contact */}
      <section id="contact" className="container mx-auto px-4 py-16">
        <h2 className="text-4xl font-bold mb-8 text-center">Get In Touch</h2>
        <div className="max-w-2xl mx-auto bg-gray-800 rounded-xl p-8">
          <div className="space-y-4 text-center">
            <p className="text-xl text-gray-300">
              Interested in working together? Let's talk!
            </p>
            <div className="flex gap-6 justify-center pt-4">
              <a href="mailto:your@email.com" className="text-blue-400 hover:text-blue-300">
                📧 Email
              </a>
              <a href="https://github.com/yourusername" className="text-blue-400 hover:text-blue-300" target="_blank" rel="noopener">
                🐙 GitHub
              </a>
              <a href="https://linkedin.com/in/yourusername" className="text-blue-400 hover:text-blue-300" target="_blank" rel="noopener">
                💼 LinkedIn
              </a>
              <a href="https://twitter.com/yourusername" className="text-blue-400 hover:text-blue-300" target="_blank" rel="noopener">
                🐦 Twitter
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="container mx-auto px-4 py-8 text-center text-gray-400 border-t border-gray-800">
        <p>© 2024 John Doe. Built with Next.js & Tailwind CSS</p>
      </footer>
    </div>
  )
}
