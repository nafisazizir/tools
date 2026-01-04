import type { Metadata } from "next";
import { Header } from "../components/header";
import { SleepTable } from "./components/sleep-table";

const title = "Sleep";
const description = "View and export your sleep data";

export const metadata: Metadata = {
  title,
  description,
};

const SleepPage = () => (
  <>
    <Header page="Sleep" pages={[]} />
    <div className="flex flex-1 flex-col gap-6 p-4 pt-0">
      <SleepTable />
    </div>
  </>
);

export default SleepPage;
