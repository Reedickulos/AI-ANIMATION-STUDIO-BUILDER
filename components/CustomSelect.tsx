import React from 'react';

// A special value to identify the "Custom" option in the dropdown
const CUSTOM_OPTION_VALUE = '__custom__';

interface CustomSelectProps {
  id: string;
  label: string;
  options: ReadonlyArray<string>;
  value: string;
  onChange: (newValue: string) => void;
  placeholder?: string;
}

const CustomSelect: React.FC<CustomSelectProps> = ({ id, label, options, value, onChange, placeholder = "Enter custom value..." }) => {
  // Determine if the current value is a custom one (i.e., not in the predefined options list)
  const isCustom = !options.includes(value);

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedValue = e.target.value;
    if (selectedValue === CUSTOM_OPTION_VALUE) {
      // When user selects "Custom...", we clear the value to an empty string.
      // This makes `isCustom` true and shows an empty text input for the user to type in.
      onChange('');
    } else {
      onChange(selectedValue);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
  };

  // The value for the <select> element. If the current value is custom,
  // the select should display "Custom...". Otherwise, it shows the value itself.
  const selectValue = isCustom ? CUSTOM_OPTION_VALUE : value;

  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1.5">{label}</label>
      <div className="flex flex-col gap-2">
        <select
          id={id}
          value={selectValue}
          onChange={handleSelectChange}
          className="w-full p-2.5 bg-slate-50 dark:bg-slate-700/50 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-fuchsia-500 focus:border-fuchsia-500 shadow-sm"
        >
          {options.map(option => (
            <option key={option} value={option}>{option}</option>
          ))}
          <option value={CUSTOM_OPTION_VALUE}>Custom...</option>
        </select>
        
        {isCustom && (
          <input
            type="text"
            value={value}
            onChange={handleInputChange}
            placeholder={placeholder}
            className="w-full p-2.5 bg-slate-50 dark:bg-slate-700/50 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:ring-2 focus:ring-fuchsia-500 focus:border-fuchsia-500 shadow-sm animate-fade-in-down"
            aria-label={`Custom value for ${label}`}
          />
        )}
      </div>
    </div>
  );
};

export default CustomSelect;
