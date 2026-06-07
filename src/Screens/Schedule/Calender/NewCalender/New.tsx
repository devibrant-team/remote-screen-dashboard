import NewCalender from "./NewCalender";
import ReservedScheduleToolbar from "./ReservedScheduleToolbar";

const New = () => {
  return (
    <div className="flex h-screen w-full bg-[#f8f9fa] text-[#1a1f2e] overflow-hidden">
      <aside
        className="
          hidden lg:flex w-[330px] shrink-0 border-r border-gray-200 bg-white
          lg:sticky lg:top-0 lg:h-screen lg:overflow-y-auto
          lg:[scrollbar-width:none]lg:[scrollbar-width:none]             lg:[-ms-overflow-style:none]
 lg:[-ms-overflow-style:none]              lg:[&::-webkit-scrollbar]:hiddenlg:[&::-webkit-scrollbar]:hidden          px-4 py-4
        "
      >
        <div className="flex h-full w-full flex-col">
          <ReservedScheduleToolbar />
        </div>
      </aside>

      <main className="min-w-0 flex-1 h-screen overflow-y-auto p-4">
        <NewCalender />
      </main>
    </div>
  );
};

export default New;
