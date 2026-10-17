import Header from "@/components/Header"
import Hero from "@/components/Hero"
import Experience from "@/components/Experience"
import Work from "@/components/Work"
import Skills from "@/components/Skills"
import About from "@/components/About"
import Contact from "@/components/Contact"

export default function App() {
  return (
    <div className="min-h-full bg-ink text-cream">
      <Header />
      <main>
        <Hero />
        <Experience />
        <Work />
        {/* <Skills /> */}
        <About />
        <Contact />
      </main>
    </div>
  )
}
