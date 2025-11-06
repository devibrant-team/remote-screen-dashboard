import GroupScreensSection from "./GroupScreensSection";
import ScreenHeader from "./ScreenHeader";
import SingleScreensSection from "./SingleScreensSection";

const ScreenManagement = () => {
  return (
    <div className="mt-6 px-4">
      {/* Page Header */}
      <ScreenHeader />
      {/* Content area */}
      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <SingleScreensSection />
        <GroupScreensSection />
      </div>
    </div>
  );
};

export default ScreenManagement;
