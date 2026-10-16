import { createContext, useContext } from 'react';
export const AppContext = createContext();
export const useAppContext = () => useContext(AppContext);

export const getCatBalKey = (category, type) => {
    if (category === 'RETAIL') {
        if (type === 'CASH') return 'retailCash';
        if (type === 'GOLD') return 'retailGold';
        return null;
    }
    if (category === 'BULLION') {
        if (type === 'CASH')   return 'bullionCash';
        if (type === 'GOLD')   return 'bullionGold';
        if (type === 'SILVER') return 'bullionSilver';
        return null;
    }
    if (category === 'SILVER') {
        if (type === 'CASH')   return 'silverCash';
        if (type === 'SILVER') return 'silverSilver';
        return null;
    }
    if (category === 'CHIT') {
        if (type === 'CASH') return 'chitCash';
        return null;
    }
    return null;
};

export const STORAGE_KEYS = [
    'jjledger_demo_customers', 'jjledger_demo_transactions', 'jjledger_demo_auth', 'jjledger_demo_chit_schemes'
];

export const MAX_CACHED_TRANSACTIONS = 1000;
