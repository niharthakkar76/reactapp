import { createContext, useContext } from 'react';
import usePersistedState from '../hooks/usePersistedState';

const AppStateContext = createContext();

export const AppStateProvider = ({ children }) => {
  // Global state that needs to be shared between components
  const [selectedExchange, setSelectedExchange] = usePersistedState('app_selectedExchange', 'nasdaq_stock_data');
  const [filterState, setFilterState] = usePersistedState('app_filterState', {
    searchTerm: '',
    symbolFilter: '',
    companyFilter: '',
    selectedRating: 'all',
    selectedSector: 'all',
    selectedIndustry: 'all',
  });
  const [sortConfig, setSortConfig] = usePersistedState('app_sortConfig', { key: null, direction: 'asc' });
  const [pageState, setPageState] = usePersistedState('app_pageState', {
    page: 0,
    scrollPosition: 0,
  });

  const value = {
    selectedExchange,
    setSelectedExchange,
    filterState,
    setFilterState,
    sortConfig,
    setSortConfig,
    pageState,
    setPageState,
  };

  return (
    <AppStateContext.Provider value={value}>
      {children}
    </AppStateContext.Provider>
  );
};

export const useAppState = () => {
  const context = useContext(AppStateContext);
  if (context === undefined) {
    throw new Error('useAppState must be used within an AppStateProvider');
  }
  return context;
};
