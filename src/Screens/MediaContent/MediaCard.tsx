const MediaCard = () => {
  const campaigns = [1, 2, 3]; // Replace with dynamic data if needed

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
      {campaigns.map((_, idx) => (
        <div
          key={idx}
          className="bg-[var(--white)] border border-gray-200 rounded-xl shadow hover:shadow-md transition overflow-hidden flex flex-col"
        >
          <img
            src="https://www.bigfootdigital.co.uk/wp-content/uploads/2020/07/image-optimisation-scaled.jpg"
            alt="Summer Campaign"
            className="w-full h-48 object-cover"
          />
          <div className="p-4 space-y-2 flex-1">
            <h3 className="text-base sm:text-lg font-semibold text-[var(--black)]">
              Summer Campaign 2024
            </h3>
            <div className="flex justify-between text-xs sm:text-sm text-gray-700">
              <span>Devices:</span><span>12</span>
            </div>
            <div className="flex justify-between text-xs sm:text-sm text-gray-700">
              <span>Duration:</span><span>2:45:30</span>
            </div>
            <div className="flex justify-between text-xs sm:text-sm text-gray-700">
              <span>Media:</span><span>8 items</span>
            </div>
            <div className="flex justify-between text-xs sm:text-sm">
              <span className="text-gray-700">Status:</span>
              <span className="text-green-600 font-medium">active</span>
            </div>
            <div className="flex justify-between text-xs sm:text-sm text-gray-700">
              <span>Scheduled:</span><span>Yes</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default MediaCard;
