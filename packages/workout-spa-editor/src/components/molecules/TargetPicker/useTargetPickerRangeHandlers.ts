export const useTargetPickerRangeHandlers = (
  minValue: string,
  maxValue: string,
  setMinValue: (value: string) => void,
  setMaxValue: (value: string) => void,
  handleRangeChange: (min: string, max: string) => void
) => {
  const handleMinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newMin = e.target.value;
    setMinValue(newMin);
    handleRangeChange(newMin, maxValue);
  };

  const handleMaxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newMax = e.target.value;
    setMaxValue(newMax);
    handleRangeChange(minValue, newMax);
  };

  return {
    handleMinChange,
    handleMaxChange,
  };
};
