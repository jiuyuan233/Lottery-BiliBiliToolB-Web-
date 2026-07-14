import HeroSection from '../components/home/HeroSection'
import FeatureCards from '../components/home/FeatureCards'
import FlowTimeline from '../components/home/FlowTimeline'
import StatsPanel from '../components/home/StatsPanel'

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <StatsPanel />
      <FeatureCards />
      <FlowTimeline />
    </>
  )
}
