const EmptyState = ({ message, icon: Icon }) => {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      {Icon && (
        <div className="mb-4 text-gray-600">
          <Icon size={64} className="text-gray-500" />
        </div>
      )}
      <p className="text-gray-400 text-lg">{message}</p>
    </div>
  );
};

export default EmptyState;
