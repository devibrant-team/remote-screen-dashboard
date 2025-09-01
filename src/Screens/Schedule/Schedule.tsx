import Calender from "./Calender";
import ScheduleToolbar from "./ScheduleToolbar";

const Schedule = () => {
  return (
    <div className="w-full min-h-screen">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-[280px_1fr]">
        {/* LEFT: Tabs/controls */}
        <aside className="md:sticky md:top-4 max-h-screen rounded-xl  border-neutral-200 bg-white p-3 ">
          {/* If your toolbar supports it, pass a vertical hint */}
          {/* <ScheduleToolbar orientation="vertical" /> */}
          <div className="flex flex-col gap-2">
            <ScheduleToolbar />
          </div>
        </aside>

        {/* RIGHT: Calendar */}
        <section className="rounded-xl bg-white p-3 ">
          <div className="h-[75vh] md:h-[82vh]">
            <Calender />
          </div>
        </section>
      </div>
    </div>
  );
};

export default Schedule;
