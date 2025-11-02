import NewCalender from "./NewCalender";
import ReservedScheduleToolbar from "./ReservedScheduleToolbar";

const New = () => {
  return (
    <div className="flex h-screen w-full bg-[#f8f9fa] text-[#1a1f2e] overflow-hidden">
      {/* ===== LEFT TOOLBAR (desktop persistent, sticky) ===== */}
      <aside
        className="
    hidden lg:flex w-[330px] shrink-0 border-r border-gray-200 bg-white
    lg:sticky lg:top-0 lg:h-screen lg:overflow-y-auto
    /* hide the scrollbar cross-browser */
    lg:[scrollbar-width:none]                 /* Firefox */
    lg:[-ms-overflow-style:none]              /* old IE/Edge */
    lg:[&::-webkit-scrollbar]:hidden          /* Chrome/Safari/Edge */
    px-4 py-4
  "
      >
        <div className="flex h-full w-full flex-col">
<ReservedScheduleToolbar/>
        </div>
      </aside>

      <NewCalender />
    </div>
  );
};

export default New;
