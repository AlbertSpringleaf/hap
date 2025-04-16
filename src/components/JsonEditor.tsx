import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronDown, ChevronRight, Calendar } from 'lucide-react';

interface JsonEditorProps {
  id: string;
  jsonData: any;
  onSave: (id: string, jsonData: any) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onProcess?: (id: string, jsonData: any) => Promise<void>;
}

// DatePicker component
const DatePicker = ({ 
  value, 
  onChange, 
  placeholder = "dd-MM-yyyy" 
}: { 
  value: string, 
  onChange: (value: string) => void,
  placeholder?: string
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState(value);
  const [error, setError] = useState<string | null>(null);
  const [currentMonth, setCurrentMonth] = useState<number>(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState<number>(new Date().getFullYear());
  const datePickerRef = useRef<HTMLDivElement>(null);
  
  // Current date for validation
  const today = new Date();
  const oneYearAgo = new Date(today);
  oneYearAgo.setFullYear(today.getFullYear() - 1);
  const twentyYearsFromNow = new Date(today);
  twentyYearsFromNow.setFullYear(today.getFullYear() + 20);
  
  // Add event listener to close the datepicker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (datePickerRef.current && !datePickerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  // Parse date from dd-MM-yyyy format
  const parseDate = (dateStr: string): Date | null => {
    if (!dateStr) return null;
    
    const parts = dateStr.split('-');
    if (parts.length !== 3) return null;
    
    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1; // JS months are 0-indexed
    const year = parseInt(parts[2], 10);
    
    if (isNaN(day) || isNaN(month) || isNaN(year)) return null;
    
    const date = new Date(year, month, day);
    
    // Check if the date is valid (e.g., not Feb 30)
    if (date.getDate() !== day || date.getMonth() !== month || date.getFullYear() !== year) {
      return null;
    }
    
    return date;
  };
  
  // Validate date according to requirements
  const validateDate = (date: Date): boolean => {
    if (!date) return false;
    
    // Check if date is not more than 20 years in the future
    if (date > twentyYearsFromNow) return false;
    
    return true;
  };
  
  // Format date as dd-MM-yyyy
  const formatDate = (date: Date): string => {
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  };
  
  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    
    // Check if the input matches the required format
    if (/^\d{2}-\d{2}-\d{4}$/.test(newValue)) {
      const date = parseDate(newValue);
      if (date && validateDate(date)) {
        setError(null);
        onChange(newValue);
      } else {
        setError('Ongeldige datum. Datum moet tussen 1 jaar geleden en 20 jaar in de toekomst liggen.');
      }
    } else if (newValue === '') {
      setError(null);
      onChange('');
    } else if (!/^\d{0,2}-?\d{0,2}-?\d{0,4}$/.test(newValue)) {
      setError('Ongeldig formaat. Gebruik dd-MM-yyyy');
    }
  };
  
  // Handle calendar click
  const handleCalendarClick = () => {
    setIsOpen(!isOpen);
    
    // If opening the calendar, set the current month and year based on the input value
    if (!isOpen && inputValue) {
      const date = parseDate(inputValue);
      if (date) {
        setCurrentMonth(date.getMonth());
        setCurrentYear(date.getFullYear());
      }
    }
  };
  
  // Handle date selection
  const handleDateSelect = (date: Date) => {
    const formattedDate = formatDate(date);
    setInputValue(formattedDate);
    setError(null);
    onChange(formattedDate);
    setIsOpen(false);
  };
  
  // Handle today button click
  const handleTodayClick = () => {
    const today = new Date();
    handleDateSelect(today);
  };
  
  // Generate calendar days
  const generateCalendarDays = () => {
    const firstDay = new Date(currentYear, currentMonth, 1);
    const lastDay = new Date(currentYear, currentMonth + 1, 0);
    
    const days = [];
    const startDay = firstDay.getDay();
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startDay; i++) {
      days.push(<div key={`empty-${i}`} className="w-8 h-8"></div>);
    }
    
    // Add cells for each day of the month
    for (let i = 1; i <= lastDay.getDate(); i++) {
      const date = new Date(currentYear, currentMonth, i);
      const isToday = date.toDateString() === new Date().toDateString();
      const isSelected = inputValue === formatDate(date);
      const isValid = validateDate(date);
      
      days.push(
        <button
          key={`day-${i}`}
          onClick={() => handleDateSelect(date)}
          disabled={!isValid}
          className={`w-8 h-8 rounded-full flex items-center justify-center text-sm
            ${isSelected ? 'bg-blue-500 text-white' : ''}
            ${isToday ? 'border border-blue-500' : ''}
            ${!isValid ? 'text-gray-300 cursor-not-allowed' : 'hover:bg-gray-100'}`}
        >
          {i}
        </button>
      );
    }
    
    return days;
  };
  
  // Generate month names
  const monthNames = [
    'Januari', 'Februari', 'Maart', 'April', 'Mei', 'Juni',
    'Juli', 'Augustus', 'September', 'Oktober', 'November', 'December'
  ];
  
  // Generate years for dropdown
  const generateYears = () => {
    const years = [];
    const currentYear = new Date().getFullYear();
    
    for (let i = currentYear - 1; i <= currentYear + 20; i++) {
      years.push(i);
    }
    
    return years;
  };
  
  // Handle month change
  const handleMonthChange = (increment: number) => {
    let newMonth = currentMonth + increment;
    let newYear = currentYear;
    
    if (newMonth > 11) {
      newMonth = 0;
      newYear++;
    } else if (newMonth < 0) {
      newMonth = 11;
      newYear--;
    }
    
    setCurrentMonth(newMonth);
    setCurrentYear(newYear);
  };
  
  // Handle month select from dropdown
  const handleMonthSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setCurrentMonth(parseInt(e.target.value, 10));
  };
  
  // Handle year select from dropdown
  const handleYearSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setCurrentYear(parseInt(e.target.value, 10));
  };
  
  return (
    <div className="relative" ref={datePickerRef}>
      <div className="flex">
        <input
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          placeholder={placeholder}
          className={`w-full p-1 border rounded ${error ? 'border-red-500' : ''}`}
        />
        <button
          type="button"
          onClick={handleCalendarClick}
          className="ml-2 p-1 border rounded hover:bg-gray-100"
        >
          <Calendar size={18} />
        </button>
      </div>
      
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
      
      {isOpen && (
        <div className="absolute z-10 mt-1 bg-white border rounded-lg shadow-lg p-2 w-64">
          <div className="flex justify-between items-center mb-2">
            <button onClick={() => handleMonthChange(-1)} className="p-1 hover:bg-gray-100 rounded">
              &lt;
            </button>
            <div className="flex items-center">
              <select 
                value={currentMonth} 
                onChange={handleMonthSelect}
                className="p-1 border rounded mr-1"
              >
                {monthNames.map((month, index) => (
                  <option key={month} value={index}>{month}</option>
                ))}
              </select>
              <select 
                value={currentYear} 
                onChange={handleYearSelect}
                className="p-1 border rounded"
              >
                {generateYears().map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>
            <button onClick={() => handleMonthChange(1)} className="p-1 hover:bg-gray-100 rounded">
              &gt;
            </button>
          </div>
          
          <div className="grid grid-cols-7 gap-1 mb-1">
            <div className="text-center text-xs font-medium">Zo</div>
            <div className="text-center text-xs font-medium">Ma</div>
            <div className="text-center text-xs font-medium">Di</div>
            <div className="text-center text-xs font-medium">Wo</div>
            <div className="text-center text-xs font-medium">Do</div>
            <div className="text-center text-xs font-medium">Vr</div>
            <div className="text-center text-xs font-medium">Za</div>
          </div>
          
          <div className="grid grid-cols-7 gap-1">
            {generateCalendarDays()}
          </div>
          
          <div className="mt-2 flex justify-center">
            <button
              onClick={handleTodayClick}
              className="px-2 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
            >
              Vandaag
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

const JsonEditor: React.FC<JsonEditorProps> = ({ id, jsonData, onSave, onDelete, onProcess }) => {
  const [editedJson, setEditedJson] = useState(jsonData);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    dossiernaam: true,
    verkopers: true,
    kopers: true,
    objecten: true,
    bedragen: true,
    overdracht: true,
    waarborg: true,
    handtekeningen: true
  });
  const router = useRouter();

  const handleSave = async () => {
    try {
      setIsSaving(true);
      setError(null);
      await onSave(id, editedJson);
      router.refresh();
    } catch (err) {
      setError('Er is een fout opgetreden bij het opslaan');
      console.error('Error saving JSON:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      await onDelete(id);
      router.push('/koopovereenkomsten');
    } catch (err) {
      setError('Er is een fout opgetreden bij het verwijderen');
      console.error('Error deleting record:', err);
    }
  };

  const handleProcess = async () => {
    try {
      setIsSaving(true);
      setError(null);
      await onSave(id, editedJson);
      if (onProcess) {
        await onProcess(id, editedJson);
      }
      router.refresh();
    } catch (err) {
      setError('Er is een fout opgetreden bij het verwerken');
      console.error('Error processing JSON:', err);
    } finally {
      setIsSaving(false);
    }
  };

  // Update een specifiek veld in de JSON
  const updateField = (path: string[], value: any) => {
    const newJson = { ...editedJson };
    let current = newJson;
    
    // Navigeer naar het juiste object in de JSON structuur
    for (let i = 0; i < path.length - 1; i++) {
      current = current[path[i]];
    }
    
    // Update het veld
    current[path[path.length - 1]] = value;
    
    setEditedJson(newJson);
  };

  // Update een veld in een array
  const updateArrayField = (arrayPath: string[], index: number, field: string, value: any) => {
    const newJson = { ...editedJson };
    let current = newJson;
    
    // Navigeer naar het juiste object in de JSON structuur
    for (let i = 0; i < arrayPath.length; i++) {
      current = current[arrayPath[i]];
    }
    
    // Update het veld in het array item
    current[index][field] = value;
    
    setEditedJson(newJson);
  };

  // Render kopers in een tabel
  const renderKopers = () => {
    if (!editedJson?.kopers?.data || editedJson.kopers.data.length === 0) {
      return (
        <div className="mb-6">
          <div 
            className="flex justify-between items-center cursor-pointer"
            onClick={() => setExpandedSections(prev => ({ ...prev, kopers: !prev.kopers }))}
          >
            <h3 className="text-lg font-medium">Kopers</h3>
            <button className="text-gray-500">
              {expandedSections.kopers ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
            </button>
          </div>
          {expandedSections.kopers && (
            <>
              <p className="mb-4 mt-2">Geen kopers gevonden</p>
              <button
                onClick={() => {
                  const newKopers = {
                    ...editedJson.kopers,
                    data: [...(editedJson.kopers?.data || []), { is_bedrijf: false }]
                  };
                  setEditedJson({
                    ...editedJson,
                    kopers: newKopers
                  });
                }}
                className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
              >
                Koper toevoegen
              </button>
            </>
          )}
        </div>
      );
    }

    // Function to copy address from first buyer to another buyer
    const copyAddressFromFirstBuyer = (index: number) => {
      if (index === 0 || !editedJson.kopers.data[0]) return;
      
      const firstBuyer = editedJson.kopers.data[0];
      const newKopers = { ...editedJson.kopers };
      
      // Copy address fields from first buyer
      newKopers.data[index] = {
        ...newKopers.data[index],
        straat: firstBuyer.straat || '',
        huisnummer: firstBuyer.huisnummer || '',
        huisnummer_toevoeging: firstBuyer.huisnummer_toevoeging || '',
        postcode: firstBuyer.postcode || '',
        woonplaats: firstBuyer.woonplaats || ''
      };
      
      setEditedJson({
        ...editedJson,
        kopers: newKopers
      });
    };

    // Get the name of the first buyer for the button text
    const getFirstBuyerName = () => {
      if (!editedJson.kopers.data[0]) return "Koper 1";
      
      const firstBuyer = editedJson.kopers.data[0];
      if (firstBuyer.is_bedrijf && firstBuyer.bedrijfsnaam) {
        return firstBuyer.bedrijfsnaam;
      } else if (firstBuyer.achternaam) {
        return `${firstBuyer.voornamen || ''} ${firstBuyer.achternaam}`.trim();
      }
      
      return "Koper 1";
    };

    return (
      <div className="mb-6">
        <div 
          className="flex justify-between items-center cursor-pointer"
          onClick={() => setExpandedSections(prev => ({ ...prev, kopers: !prev.kopers }))}
        >
          <h3 className="text-lg font-medium">Kopers</h3>
          <button className="text-gray-500">
            {expandedSections.kopers ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
          </button>
        </div>
        {expandedSections.kopers && (
          <>
            <div className="grid grid-cols-1 gap-4 mt-2">
              {editedJson.kopers.data.map((koper: any, index: number) => {
                // Bepaal of dit een bedrijf is op basis van de gevulde velden
                const isBedrijf = koper.is_bedrijf || 
                  (koper.bedrijfsnaam && koper['kvk-nummer'] && 
                   !koper.achternaam && !koper.voornamen && !koper.geboortedatum && !koper.geboorteplaats);
                
                // Update de is_bedrijf waarde als deze nog niet is ingesteld
                if (isBedrijf !== koper.is_bedrijf) {
                  updateArrayField(['kopers', 'data'], index, 'is_bedrijf', isBedrijf);
                }
                
                return (
                  <div key={index} className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                    <div className="flex justify-between items-center mb-2">
                      <h4 className="font-medium text-gray-700">Koper {index + 1}</h4>
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            const newKopers = {
                              ...editedJson.kopers,
                              data: editedJson.kopers.data.filter((_: any, i: number) => i !== index)
                            };
                            setEditedJson({
                              ...editedJson,
                              kopers: newKopers
                            });
                          }}
                          className="px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600 text-sm"
                        >
                          Verwijderen
                        </button>
                      </div>
                    </div>
                    
                    <div className="mb-4">
                      <label className="inline-flex items-center">
                        <input
                          type="checkbox"
                          checked={isBedrijf}
                          onChange={(e) => {
                            const isBedrijf = e.target.checked;
                            updateArrayField(['kopers', 'data'], index, 'is_bedrijf', isBedrijf);
                            
                            // Als we switchen naar bedrijf, verwijder persoonlijke velden
                            if (isBedrijf) {
                              const newKoper = { ...koper, is_bedrijf: true };
                              delete newKoper.voornamen;
                              delete newKoper.achternaam;
                              delete newKoper.geboortedatum;
                              delete newKoper.geboorteplaats;
                              delete newKoper.burgerlijke_staat;
                              setEditedJson({
                                ...editedJson,
                                kopers: {
                                  ...editedJson.kopers,
                                  data: editedJson.kopers.data.map((k: any, i: number) => 
                                    i === index ? newKoper : k
                                  )
                                }
                              });
                            } else {
                              // Als we switchen naar persoon, verwijder bedrijfsvelden
                              const newKoper = { ...koper, is_bedrijf: false };
                              delete newKoper.bedrijfsnaam;
                              delete newKoper['kvk-nummer'];
                              setEditedJson({
                                ...editedJson,
                                kopers: {
                                  ...editedJson.kopers,
                                  data: editedJson.kopers.data.map((k: any, i: number) => 
                                    i === index ? newKoper : k
                                  )
                                }
                              });
                            }
                          }}
                          className="form-checkbox h-4 w-4 text-blue-600"
                        />
                        <span className="ml-2 text-sm text-gray-700">Bedrijf</span>
                      </label>
                    </div>
                    
                    {isBedrijf ? (
                      // Bedrijfsvelden
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div className="font-medium">Bedrijfsnaam:</div>
                        <div>
                          <input
                            type="text"
                            value={koper.bedrijfsnaam || ''}
                            onChange={(e) => updateArrayField(['kopers', 'data'], index, 'bedrijfsnaam', e.target.value)}
                            className="w-full p-1 border rounded"
                          />
                        </div>
                        
                        <div className="font-medium">KvK-nummer:</div>
                        <div>
                          <input
                            type="text"
                            value={koper['kvk-nummer'] || ''}
                            onChange={(e) => updateArrayField(['kopers', 'data'], index, 'kvk-nummer', e.target.value)}
                            className="w-full p-1 border rounded"
                          />
                        </div>
                      </div>
                    ) : (
                      // Persoonlijke velden
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div className="font-medium">Achternaam:</div>
                        <div>
                          <input
                            type="text"
                            value={koper.achternaam || ''}
                            onChange={(e) => updateArrayField(['kopers', 'data'], index, 'achternaam', e.target.value)}
                            className="w-full p-1 border rounded"
                          />
                        </div>
                        
                        <div className="font-medium">Voornamen:</div>
                        <div>
                          <input
                            type="text"
                            value={koper.voornamen || ''}
                            onChange={(e) => updateArrayField(['kopers', 'data'], index, 'voornamen', e.target.value)}
                            className="w-full p-1 border rounded"
                          />
                        </div>
                        
                        <div className="font-medium">Geboorteplaats:</div>
                        <div>
                          <input
                            type="text"
                            value={koper.geboorteplaats || ''}
                            onChange={(e) => updateArrayField(['kopers', 'data'], index, 'geboorteplaats', e.target.value)}
                            className="w-full p-1 border rounded"
                          />
                        </div>
                        
                        <div className="font-medium">Geboortedatum:</div>
                        <div>
                          <DatePicker
                            value={koper.geboortedatum || ''}
                            onChange={(value) => updateArrayField(['kopers', 'data'], index, 'geboortedatum', value)}
                          />
                        </div>
                        
                        <div className="font-medium">Adres:</div>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={koper.straat || ''}
                            onChange={(e) => updateArrayField(['kopers', 'data'], index, 'straat', e.target.value)}
                            className="w-full p-1 border rounded"
                          />
                          <input
                            type="text"
                            value={koper.huisnummer || ''}
                            onChange={(e) => updateArrayField(['kopers', 'data'], index, 'huisnummer', e.target.value)}
                            className="w-20 p-1 border rounded"
                          />
                          <input
                            type="text"
                            value={koper.huisnummer_toevoeging || ''}
                            onChange={(e) => updateArrayField(['kopers', 'data'], index, 'huisnummer_toevoeging', e.target.value)}
                            className="w-20 p-1 border rounded"
                            placeholder="Toevoeging"
                          />
                        </div>
                        
                        <div className="font-medium">Postcode:</div>
                        <div>
                          <input
                            type="text"
                            value={koper.postcode || ''}
                            onChange={(e) => updateArrayField(['kopers', 'data'], index, 'postcode', e.target.value)}
                            className="w-full p-1 border rounded"
                          />
                        </div>
                        
                        <div className="font-medium">Woonplaats:</div>
                        <div>
                          <input
                            type="text"
                            value={koper.woonplaats || ''}
                            onChange={(e) => updateArrayField(['kopers', 'data'], index, 'woonplaats', e.target.value)}
                            className="w-full p-1 border rounded"
                          />
                        </div>
                        
                        <div className="font-medium">E-mailadres:</div>
                        <div>
                          <input
                            type="text"
                            value={koper['e-mailadres'] || ''}
                            onChange={(e) => updateArrayField(['kopers', 'data'], index, 'e-mailadres', e.target.value)}
                            className="w-full p-1 border rounded"
                          />
                        </div>
                        
                        <div className="font-medium">Telefoon:</div>
                        <div>
                          <input
                            type="text"
                            value={koper.telefoon || ''}
                            onChange={(e) => updateArrayField(['kopers', 'data'], index, 'telefoon', e.target.value)}
                            className="w-full p-1 border rounded"
                          />
                        </div>
                        
                        <div className="font-medium">Mobiel:</div>
                        <div>
                          <input
                            type="text"
                            value={koper.mobiel || ''}
                            onChange={(e) => updateArrayField(['kopers', 'data'], index, 'mobiel', e.target.value)}
                            className="w-full p-1 border rounded"
                          />
                        </div>
                        
                        <div className="font-medium">Telefoon zakelijk:</div>
                        <div>
                          <input
                            type="text"
                            value={koper.telefoon_zakelijk || ''}
                            onChange={(e) => updateArrayField(['kopers', 'data'], index, 'telefoon_zakelijk', e.target.value)}
                            className="w-full p-1 border rounded"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            <div className="mt-4">
              <button
                onClick={() => {
                  const newKopers = {
                    ...editedJson.kopers,
                    data: [...editedJson.kopers.data, { is_bedrijf: false }]
                  };
                  setEditedJson({
                    ...editedJson,
                    kopers: newKopers
                  });
                }}
                className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
              >
                Koper toevoegen
              </button>
            </div>
          </>
        )}
      </div>
    );
  };

  // Render objecten in een tabel
  const renderObjecten = () => {
    if (!editedJson?.objecten?.data || editedJson.objecten.data.length === 0) {
      return (
        <div className="mb-6">
          <div 
            className="flex justify-between items-center cursor-pointer"
            onClick={() => setExpandedSections(prev => ({ ...prev, objecten: !prev.objecten }))}
          >
            <h3 className="text-lg font-medium">Objecten</h3>
            <button className="text-gray-500">
              {expandedSections.objecten ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
            </button>
          </div>
          {expandedSections.objecten && (
            <>
              <p className="mb-4 mt-2">Geen objecten gevonden</p>
              <button
                onClick={() => {
                  const newObjecten = {
                    ...editedJson.objecten,
                    data: [...(editedJson.objecten?.data || []), {}]
                  };
                  setEditedJson({
                    ...editedJson,
                    objecten: newObjecten
                  });
                }}
                className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
              >
                Object toevoegen
              </button>
            </>
          )}
        </div>
      );
    }

    return (
      <div className="mb-6">
        <div 
          className="flex justify-between items-center cursor-pointer"
          onClick={() => setExpandedSections(prev => ({ ...prev, objecten: !prev.objecten }))}
        >
          <h3 className="text-lg font-medium">Objecten</h3>
          <button className="text-gray-500">
            {expandedSections.objecten ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
          </button>
        </div>
        {expandedSections.objecten && (
          <div className="grid grid-cols-1 gap-4 mt-2">
            {editedJson.objecten.data.map((object: any, index: number) => (
              <div key={index} className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="font-medium text-gray-700">Object {index + 1}</h4>
                  <button
                    onClick={() => {
                      const newObjecten = {
                        ...editedJson.objecten,
                        data: editedJson.objecten.data.filter((_: any, i: number) => i !== index)
                      };
                      setEditedJson({
                        ...editedJson,
                        objecten: newObjecten
                      });
                    }}
                    className="px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600 text-sm"
                  >
                    Verwijderen
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="font-medium">Kadastraal nummer:</div>
                  <div>
                    <input
                      type="text"
                      value={object.kadastraal_nummer || ''}
                      onChange={(e) => updateArrayField(['objecten', 'data'], index, 'kadastraal_nummer', e.target.value)}
                      className="w-full p-1 border rounded"
                    />
                  </div>
                  <div className="font-medium">Adres:</div>
                  <div>
                    <input
                      type="text"
                      value={object.adres || ''}
                      onChange={(e) => updateArrayField(['objecten', 'data'], index, 'adres', e.target.value)}
                      className="w-full p-1 border rounded"
                    />
                  </div>
                  <div className="font-medium">Postcode:</div>
                  <div>
                    <input
                      type="text"
                      value={object.postcode || ''}
                      onChange={(e) => updateArrayField(['objecten', 'data'], index, 'postcode', e.target.value)}
                      className="w-full p-1 border rounded"
                    />
                  </div>
                  <div className="font-medium">Plaats:</div>
                  <div>
                    <input
                      type="text"
                      value={object.plaats || ''}
                      onChange={(e) => updateArrayField(['objecten', 'data'], index, 'plaats', e.target.value)}
                      className="w-full p-1 border rounded"
                    />
                  </div>
                  <div className="font-medium">Type:</div>
                  <div>
                    <input
                      type="text"
                      value={object.type || ''}
                      onChange={(e) => updateArrayField(['objecten', 'data'], index, 'type', e.target.value)}
                      className="w-full p-1 border rounded"
                    />
                  </div>
                  <div className="font-medium">Oppervlakte:</div>
                  <div>
                    <input
                      type="text"
                      value={object.oppervlakte || ''}
                      onChange={(e) => updateArrayField(['objecten', 'data'], index, 'oppervlakte', e.target.value)}
                      className="w-full p-1 border rounded"
                    />
                  </div>
                  <div className="font-medium">Perceel:</div>
                  <div>
                    <input
                      type="text"
                      value={object.perceel || ''}
                      onChange={(e) => updateArrayField(['objecten', 'data'], index, 'perceel', e.target.value)}
                      className="w-full p-1 border rounded"
                    />
                  </div>
                  <div className="font-medium">Sectie:</div>
                  <div>
                    <input
                      type="text"
                      value={object.sectie || ''}
                      onChange={(e) => updateArrayField(['objecten', 'data'], index, 'sectie', e.target.value)}
                      className="w-full p-1 border rounded"
                    />
                  </div>
                </div>
              </div>
            ))}
            <div className="mt-4">
              <button
                onClick={() => {
                  const newObjecten = {
                    ...editedJson.objecten,
                    data: [...editedJson.objecten.data, {}]
                  };
                  setEditedJson({
                    ...editedJson,
                    objecten: newObjecten
                  });
                }}
                className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
              >
                Object toevoegen
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

  // Render bedragen in een tabel
  const renderBedragen = () => {
    if (!editedJson?.bedragen) {
      return null;
    }

    return (
      <div className="mb-6">
        <div 
          className="flex justify-between items-center cursor-pointer"
          onClick={() => setExpandedSections(prev => ({ ...prev, bedragen: !prev.bedragen }))}
        >
          <h3 className="text-lg font-medium">Bedragen</h3>
          <button className="text-gray-500">
            {expandedSections.bedragen ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
          </button>
        </div>
        {expandedSections.bedragen && (
          <div className="grid grid-cols-2 gap-2 text-sm mt-2">
            <div className="font-medium">Koopsom:</div>
            <div>
              <div className="relative">
                <span className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-500">€</span>
                <input
                  type="text"
                  value={editedJson.bedragen.koopsom || ''}
                  onChange={(e) => {
                    // Format the input value with . for thousands and , for decimals
                    const value = e.target.value.replace(/\./g, '').replace(',', '.');
                    updateField(['bedragen', 'koopsom'], value);
                  }}
                  onBlur={(e) => {
                    // Format the display value when focus is lost
                    const value = e.target.value;
                    if (value) {
                      const numValue = parseFloat(value.replace(/\./g, '').replace(',', '.'));
                      if (!isNaN(numValue)) {
                        const formattedValue = numValue.toLocaleString('nl-NL', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2
                        });
                        updateField(['bedragen', 'koopsom'], formattedValue);
                      }
                    }
                  }}
                  className="w-full p-1 pl-6 border rounded"
                />
              </div>
            </div>
            <div className="font-medium">Roerende zaken:</div>
            <div>
              <div className="relative">
                <span className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-500">€</span>
                <input
                  type="text"
                  value={editedJson.bedragen.roerende_zaken || ''}
                  onChange={(e) => {
                    // Format the input value with . for thousands and , for decimals
                    const value = e.target.value.replace(/\./g, '').replace(',', '.');
                    updateField(['bedragen', 'roerende_zaken'], value);
                  }}
                  onBlur={(e) => {
                    // Format the display value when focus is lost
                    const value = e.target.value;
                    if (value) {
                      const numValue = parseFloat(value.replace(/\./g, '').replace(',', '.'));
                      if (!isNaN(numValue)) {
                        const formattedValue = numValue.toLocaleString('nl-NL', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2
                        });
                        updateField(['bedragen', 'roerende_zaken'], formattedValue);
                      }
                    }
                  }}
                  className="w-full p-1 pl-6 border rounded"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  // Render overdracht in een tabel
  const renderOverdracht = () => {
    if (!editedJson?.overdracht) {
      return null;
    }

    return (
      <div className="mb-6">
        <div 
          className="flex justify-between items-center cursor-pointer"
          onClick={() => setExpandedSections(prev => ({ ...prev, overdracht: !prev.overdracht }))}
        >
          <h3 className="text-lg font-medium">Overdracht</h3>
          <button className="text-gray-500">
            {expandedSections.overdracht ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
          </button>
        </div>
        {expandedSections.overdracht && (
          <div className="grid grid-cols-2 gap-2 text-sm mt-2">
            <div className="font-medium">Passeerdatum:</div>
            <div>
              <DatePicker
                value={editedJson.overdracht.passeerdatum || ''}
                onChange={(value) => updateField(['overdracht', 'passeerdatum'], value)}
              />
            </div>
          </div>
        )}
      </div>
    );
  };

  // Render waarborg in een tabel
  const renderWaarborg = () => {
    if (!editedJson?.waarborg) {
      return null;
    }

    return (
      <div className="mb-6">
        <div 
          className="flex justify-between items-center cursor-pointer"
          onClick={() => setExpandedSections(prev => ({ ...prev, waarborg: !prev.waarborg }))}
        >
          <h3 className="text-lg font-medium">Waarborg</h3>
          <button className="text-gray-500">
            {expandedSections.waarborg ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
          </button>
        </div>
        {expandedSections.waarborg && (
          <div className="grid grid-cols-2 gap-2 text-sm mt-2">
            <div className="font-medium">Waarborg som:</div>
            <div>
              <div className="relative">
                <span className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-500">€</span>
                <input
                  type="text"
                  value={editedJson.waarborg.waarborgsom || ''}
                  onChange={(e) => {
                    // Format the input value with . for thousands and , for decimals
                    const value = e.target.value.replace(/\./g, '').replace(',', '.');
                    updateField(['waarborg', 'waarborgsom'], value);
                  }}
                  onBlur={(e) => {
                    // Format the display value when focus is lost
                    const value = e.target.value;
                    if (value) {
                      const numValue = parseFloat(value.replace(/\./g, '').replace(',', '.'));
                      if (!isNaN(numValue)) {
                        const formattedValue = numValue.toLocaleString('nl-NL', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2
                        });
                        updateField(['waarborg', 'waarborgsom'], formattedValue);
                      }
                    }
                  }}
                  className="w-full p-1 pl-6 border rounded"
                />
              </div>
            </div>
            <div className="font-medium">Waarborgdatum:</div>
            <div>
              <DatePicker
                value={editedJson.waarborg.waarborgdatum || ''}
                onChange={(value) => updateField(['waarborg', 'waarborgdatum'], value)}
              />
            </div>
          </div>
        )}
      </div>
    );
  };

  // Render handtekeningen in een tabel
  const renderHandtekeningen = () => {
    if (!editedJson?.handtekeningen) {
      return null;
    }

    return (
      <div className="mb-6">
        <div 
          className="flex justify-between items-center cursor-pointer"
          onClick={() => setExpandedSections(prev => ({ ...prev, handtekeningen: !prev.handtekeningen }))}
        >
          <h3 className="text-lg font-medium">Handtekeningen</h3>
          <button className="text-gray-500">
            {expandedSections.handtekeningen ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
          </button>
        </div>
        {expandedSections.handtekeningen && (
          <div className="grid grid-cols-2 gap-2 text-sm mt-2">
            <div className="font-medium">Ondertekendatum kopers:</div>
            <div>
              <DatePicker
                value={editedJson.handtekeningen.ondertekendatum_kopers || ''}
                onChange={(value) => updateField(['handtekeningen', 'ondertekendatum_kopers'], value)}
              />
            </div>
            <div className="font-medium">Ondertekendatum verkopers:</div>
            <div>
              <DatePicker
                value={editedJson.handtekeningen.ondertekendatum_verkopers || ''}
                onChange={(value) => updateField(['handtekeningen', 'ondertekendatum_verkopers'], value)}
              />
            </div>
          </div>
        )}
      </div>
    );
  };

  // Render verkopers in een tabel
  const renderVerkopers = () => {
    if (!editedJson?.verkopers?.data || editedJson.verkopers.data.length === 0) {
      return (
        <div className="mb-6">
          <div 
            className="flex justify-between items-center cursor-pointer"
            onClick={() => setExpandedSections(prev => ({ ...prev, verkopers: !prev.verkopers }))}
          >
            <h3 className="text-lg font-medium">Verkopers</h3>
            <button className="text-gray-500">
              {expandedSections.verkopers ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
            </button>
          </div>
          {expandedSections.verkopers && (
            <>
              <p className="mb-4 mt-2">Geen verkopers gevonden</p>
              <button
                onClick={() => {
                  const newVerkopers = {
                    ...editedJson.verkopers,
                    data: [...(editedJson.verkopers?.data || []), { is_bedrijf: false }]
                  };
                  setEditedJson({
                    ...editedJson,
                    verkopers: newVerkopers
                  });
                }}
                className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
              >
                Verkoper toevoegen
              </button>
            </>
          )}
        </div>
      );
    }

    // Function to copy address from first seller to another seller
    const copyAddressFromFirstSeller = (index: number) => {
      if (index === 0 || !editedJson.verkopers.data[0]) return;
      
      const firstSeller = editedJson.verkopers.data[0];
      const newVerkopers = { ...editedJson.verkopers };
      
      // Copy address fields from first seller
      newVerkopers.data[index] = {
        ...newVerkopers.data[index],
        straat: firstSeller.straat || '',
        huisnummer: firstSeller.huisnummer || '',
        huisnummer_toevoeging: firstSeller.huisnummer_toevoeging || '',
        postcode: firstSeller.postcode || '',
        woonplaats: firstSeller.woonplaats || ''
      };
      
      setEditedJson({
        ...editedJson,
        verkopers: newVerkopers
      });
    };

    // Get the name of the first seller for the button text
    const getFirstSellerName = () => {
      if (!editedJson.verkopers.data[0]) return "Verkoper 1";
      
      const firstSeller = editedJson.verkopers.data[0];
      if (firstSeller.is_bedrijf && firstSeller.bedrijfsnaam) {
        return firstSeller.bedrijfsnaam;
      } else if (firstSeller.achternaam) {
        return `${firstSeller.voornamen || ''} ${firstSeller.achternaam}`.trim();
      }
      
      return "Verkoper 1";
    };

    return (
      <div className="mb-6">
        <div 
          className="flex justify-between items-center cursor-pointer"
          onClick={() => setExpandedSections(prev => ({ ...prev, verkopers: !prev.verkopers }))}
        >
          <h3 className="text-lg font-medium">Verkopers</h3>
          <button className="text-gray-500">
            {expandedSections.verkopers ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
          </button>
        </div>
        {expandedSections.verkopers && (
          <>
            <div className="grid grid-cols-1 gap-4 mt-2">
              {editedJson.verkopers.data.map((verkoper: any, index: number) => {
                // Bepaal of dit een bedrijf is op basis van de gevulde velden
                const isBedrijf = verkoper.is_bedrijf || 
                  (verkoper.bedrijfsnaam && verkoper['kvk-nummer'] && 
                   !verkoper.achternaam && !verkoper.voornamen && !verkoper.geboortedatum && !verkoper.geboorteplaats);
                
                // Update de is_bedrijf waarde als deze nog niet is ingesteld
                if (isBedrijf !== verkoper.is_bedrijf) {
                  updateArrayField(['verkopers', 'data'], index, 'is_bedrijf', isBedrijf);
                }
                
                return (
                  <div key={index} className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                    <div className="flex justify-between items-center mb-2">
                      <h4 className="font-medium text-gray-700">Verkoper {index + 1}</h4>
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            const newVerkopers = {
                              ...editedJson.verkopers,
                              data: editedJson.verkopers.data.filter((_: any, i: number) => i !== index)
                            };
                            setEditedJson({
                              ...editedJson,
                              verkopers: newVerkopers
                            });
                          }}
                          className="px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600 text-sm"
                        >
                          Verwijderen
                        </button>
                      </div>
                    </div>
                    
                    <div className="mb-4">
                      <label className="inline-flex items-center">
                        <input
                          type="checkbox"
                          checked={isBedrijf}
                          onChange={(e) => {
                            const isBedrijf = e.target.checked;
                            updateArrayField(['verkopers', 'data'], index, 'is_bedrijf', isBedrijf);
                            
                            // Als we switchen naar bedrijf, verwijder persoonlijke velden
                            if (isBedrijf) {
                              const newVerkoper = { ...verkoper, is_bedrijf: true };
                              delete newVerkoper.voornamen;
                              delete newVerkoper.achternaam;
                              delete newVerkoper.geboortedatum;
                              delete newVerkoper.geboorteplaats;
                              delete newVerkoper.burgerlijke_staat;
                              setEditedJson({
                                ...editedJson,
                                verkopers: {
                                  ...editedJson.verkopers,
                                  data: editedJson.verkopers.data.map((v: any, i: number) => 
                                    i === index ? newVerkoper : v
                                  )
                                }
                              });
                            } else {
                              // Als we switchen naar persoon, verwijder bedrijfsvelden
                              const newVerkoper = { ...verkoper, is_bedrijf: false };
                              delete newVerkoper.bedrijfsnaam;
                              delete newVerkoper['kvk-nummer'];
                              setEditedJson({
                                ...editedJson,
                                verkopers: {
                                  ...editedJson.verkopers,
                                  data: editedJson.verkopers.data.map((v: any, i: number) => 
                                    i === index ? newVerkoper : v
                                  )
                                }
                              });
                            }
                          }}
                          className="form-checkbox h-4 w-4 text-blue-600"
                        />
                        <span className="ml-2 text-sm text-gray-700">Bedrijf</span>
                      </label>
                    </div>
                    
                    {isBedrijf ? (
                      // Bedrijfsvelden
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div className="font-medium">Bedrijfsnaam:</div>
                        <div>
                          <input
                            type="text"
                            value={verkoper.bedrijfsnaam || ''}
                            onChange={(e) => updateArrayField(['verkopers', 'data'], index, 'bedrijfsnaam', e.target.value)}
                            className="w-full p-1 border rounded"
                          />
                        </div>
                        
                        <div className="font-medium">KvK-nummer:</div>
                        <div>
                          <input
                            type="text"
                            value={verkoper['kvk-nummer'] || ''}
                            onChange={(e) => updateArrayField(['verkopers', 'data'], index, 'kvk-nummer', e.target.value)}
                            className="w-full p-1 border rounded"
                          />
                        </div>
                      </div>
                    ) : (
                      // Persoonlijke velden
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div className="font-medium">Achternaam:</div>
                        <div>
                          <input
                            type="text"
                            value={verkoper.achternaam || ''}
                            onChange={(e) => updateArrayField(['verkopers', 'data'], index, 'achternaam', e.target.value)}
                            className="w-full p-1 border rounded"
                          />
                        </div>
                        
                        <div className="font-medium">Voornamen:</div>
                        <div>
                          <input
                            type="text"
                            value={verkoper.voornamen || ''}
                            onChange={(e) => updateArrayField(['verkopers', 'data'], index, 'voornamen', e.target.value)}
                            className="w-full p-1 border rounded"
                          />
                        </div>
                        
                        <div className="font-medium">Geboorteplaats:</div>
                        <div>
                          <input
                            type="text"
                            value={verkoper.geboorteplaats || ''}
                            onChange={(e) => updateArrayField(['verkopers', 'data'], index, 'geboorteplaats', e.target.value)}
                            className="w-full p-1 border rounded"
                          />
                        </div>
                        
                        <div className="font-medium">Geboortedatum:</div>
                        <div>
                          <DatePicker
                            value={verkoper.geboortedatum || ''}
                            onChange={(value) => updateArrayField(['verkopers', 'data'], index, 'geboortedatum', value)}
                          />
                        </div>
                        
                        <div className="font-medium">Adres:</div>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={verkoper.straat || ''}
                            onChange={(e) => updateArrayField(['verkopers', 'data'], index, 'straat', e.target.value)}
                            className="w-full p-1 border rounded"
                          />
                          <input
                            type="text"
                            value={verkoper.huisnummer || ''}
                            onChange={(e) => updateArrayField(['verkopers', 'data'], index, 'huisnummer', e.target.value)}
                            className="w-20 p-1 border rounded"
                          />
                          <input
                            type="text"
                            value={verkoper.huisnummer_toevoeging || ''}
                            onChange={(e) => updateArrayField(['verkopers', 'data'], index, 'huisnummer_toevoeging', e.target.value)}
                            className="w-20 p-1 border rounded"
                            placeholder="Toevoeging"
                          />
                        </div>
                        
                        <div className="font-medium">Postcode:</div>
                        <div>
                          <input
                            type="text"
                            value={verkoper.postcode || ''}
                            onChange={(e) => updateArrayField(['verkopers', 'data'], index, 'postcode', e.target.value)}
                            className="w-full p-1 border rounded"
                          />
                        </div>
                        
                        <div className="font-medium">Woonplaats:</div>
                        <div>
                          <input
                            type="text"
                            value={verkoper.woonplaats || ''}
                            onChange={(e) => updateArrayField(['verkopers', 'data'], index, 'woonplaats', e.target.value)}
                            className="w-full p-1 border rounded"
                          />
                        </div>
                        
                        <div className="font-medium">E-mailadres:</div>
                        <div>
                          <input
                            type="text"
                            value={verkoper['e-mailadres'] || ''}
                            onChange={(e) => updateArrayField(['verkopers', 'data'], index, 'e-mailadres', e.target.value)}
                            className="w-full p-1 border rounded"
                          />
                        </div>
                        
                        <div className="font-medium">Telefoon:</div>
                        <div>
                          <input
                            type="text"
                            value={verkoper.telefoon || ''}
                            onChange={(e) => updateArrayField(['verkopers', 'data'], index, 'telefoon', e.target.value)}
                            className="w-full p-1 border rounded"
                          />
                        </div>
                        
                        <div className="font-medium">Mobiel:</div>
                        <div>
                          <input
                            type="text"
                            value={verkoper.mobiel || ''}
                            onChange={(e) => updateArrayField(['verkopers', 'data'], index, 'mobiel', e.target.value)}
                            className="w-full p-1 border rounded"
                          />
                        </div>
                        
                        <div className="font-medium">Telefoon zakelijk:</div>
                        <div>
                          <input
                            type="text"
                            value={verkoper.telefoon_zakelijk || ''}
                            onChange={(e) => updateArrayField(['verkopers', 'data'], index, 'telefoon_zakelijk', e.target.value)}
                            className="w-full p-1 border rounded"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            <div className="mt-4">
              <button
                onClick={() => {
                  const newVerkopers = {
                    ...editedJson.verkopers,
                    data: [...editedJson.verkopers.data, { is_bedrijf: false }]
                  };
                  setEditedJson({
                    ...editedJson,
                    verkopers: newVerkopers
                  });
                }}
                className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
              >
                Verkoper toevoegen
              </button>
            </div>
          </>
        )}
      </div>
    );
  };

  // Render dossiernaam
  const renderDossiernaam = () => {
    if (!editedJson?.dossiernaam) {
      return null;
    }

    return (
      <div className="mb-6">
        <div 
          className="flex justify-between items-center cursor-pointer"
          onClick={() => setExpandedSections(prev => ({ ...prev, dossiernaam: !prev.dossiernaam }))}
        >
          <h3 className="text-lg font-medium">Dossiernaam</h3>
          <button className="text-gray-500">
            {expandedSections.dossiernaam ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
          </button>
        </div>
        {expandedSections.dossiernaam && (
          <div className="mt-2 bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
            <input
              type="text"
              value={editedJson.dossiernaam}
              onChange={(e) => updateField(['dossiernaam'], e.target.value)}
              className="w-full p-1 border rounded"
            />
          </div>
        )}
      </div>
    );
  };

  return (
    <div>
      <div className="mb-4">
        <h2 className="text-lg font-medium">Uitgelezen Data</h2>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 text-red-600 rounded-lg">
          {error}
        </div>
      )}

      <div className="bg-gray-50 rounded-lg p-4 h-[800px] overflow-auto">
        {renderDossiernaam()}
        {renderVerkopers()}
        {renderKopers()}
        {renderObjecten()}
        {renderBedragen()}
        {renderOverdracht()}
        {renderWaarborg()}
        {renderHandtekeningen()}
      </div>
      
      <div className="mt-4 flex justify-end gap-4">
        <button
          onClick={() => setShowDeleteConfirm(true)}
          className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
        >
          Verwijderen
        </button>
        
        <button
          onClick={() => router.push('/koopovereenkomsten')}
          className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
        >
          Annuleren
        </button>
        
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-blue-300"
        >
          {isSaving ? 'Opslaan...' : 'Opslaan'}
        </button>

        {onProcess && (
          <button
            onClick={handleProcess}
            disabled={isSaving}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:bg-green-300"
          >
            {isSaving ? 'Verwerken...' : 'Verwerken'}
          </button>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-medium mb-4">Weet je het zeker?</h3>
            <p className="mb-6">
              Je staat op het punt om deze koopovereenkomst te verwijderen. Deze actie kan niet ongedaan worden gemaakt.
            </p>
            <div className="flex justify-end gap-4">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
              >
                Annuleren
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
              >
                Verwijderen
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default JsonEditor; 