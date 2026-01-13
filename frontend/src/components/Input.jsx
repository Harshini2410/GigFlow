const Input = ({
  label,
  type = 'text',
  value,
  onChange,
  placeholder,
  error,
  className = '',
  ...props
}) => {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-gray-300 mb-2">
          {label}
        </label>
      )}
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={`w-full px-4 py-3 bg-dark-700 border ${
          error ? 'border-red-500' : 'border-dark-600'
        } rounded-xl text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-accent-teal focus:border-transparent transition-all duration-200 ${className}`}
        {...props}
      />
      {error && (
        <p className="mt-1 text-sm text-red-400">{error}</p>
      )}
    </div>
  );
};

export default Input;
