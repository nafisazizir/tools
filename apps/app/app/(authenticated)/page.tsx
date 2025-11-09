import type { Metadata } from "next";
import { redirect } from "next/navigation";

const title = "Tools";
const description = "Tools built by Nafis Riza";

export const metadata: Metadata = {
  title,
  description,
};

const App = () => {
  redirect("/workouts");
};

export default App;
