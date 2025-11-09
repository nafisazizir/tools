import type { Metadata } from "next";
import { Header } from "../components/header";

const title = "Workout";
const description = "Workout data";

export const metadata: Metadata = {
  title,
  description,
};

const App = async () => (
  <>
    <Header page="Workout" pages={[]} />
  </>
);

export default App;
