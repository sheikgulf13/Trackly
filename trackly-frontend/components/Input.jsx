
const Input = ({
  label,
  name,
  type = "text",
  required = false,
  value,
  onChange,
}) => {
  return (
    <div className="mb-4">
      <label
        htmlFor={name}
        className="block text-sm font-medium text-gray-700 mb-1"
      >
        {label}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        required={required}
        value={value}
        onChange={onChange}
        className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500"
      />
    </div>
  );
};

export default Input;
