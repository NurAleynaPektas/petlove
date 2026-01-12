import { Outlet } from "react-router-dom";
import Header from "./Header";

import Loader from "../../pages/Loader";
import { useInitialLoader } from "../../services/useInitialLoader";

export default function MainLayout() {
  const { show, progress } = useInitialLoader({
    durationMs: 1800,
    oncePerSession: true, 
  });

  return (
    <>
      {show && <Loader progress={progress} />}

      <Header />
      <main>
        <Outlet />
      </main>
    </>
  );
}
