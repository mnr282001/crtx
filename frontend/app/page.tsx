import LandingPage from "./landing/LandingPage";
import HomeAuthRouter from "./components/HomeAuthRouter";

export default function Home() {
  return (
    <HomeAuthRouter>
      <LandingPage />
    </HomeAuthRouter>
  );
}
