import { supabase } from './supabaseClient.js';

async function checkTables() {
    // Check NASDAQ table
    const { data: nasdaqData, error: nasdaqError } = await supabase
        .from('nasdaq_predictions')
        .select('*')
        .limit(1);
    
    if (nasdaqError) {
        console.error('NASDAQ Error:', nasdaqError);
    } else {
        console.log('NASDAQ Schema:', Object.keys(nasdaqData[0]));
        console.log('NASDAQ Sample:', nasdaqData[0]);
    }

    // Check LSE table
    const { data: lseData, error: lseError } = await supabase
        .from('lse_predictions')
        .select('*')
        .limit(1);
    
    if (lseError) {
        console.error('LSE Error:', lseError);
    } else {
        console.log('LSE Schema:', Object.keys(lseData[0]));
        console.log('LSE Sample:', lseData[0]);
    }

    // Check FSE table
    const { data: fseData, error: fseError } = await supabase
        .from('fse_predictions')
        .select('*')
        .limit(1);
    
    if (fseError) {
        console.error('FSE Error:', fseError);
    } else {
        console.log('FSE Schema:', Object.keys(fseData[0]));
        console.log('FSE Sample:', fseData[0]);
    }

    // Check NYSE table
    const { data: nyseData, error: nyseError } = await supabase
        .from('nyse_predictions')
        .select('*')
        .limit(1);
    
    if (nyseError) {
        console.error('NYSE Error:', nyseError);
    } else {
        console.log('NYSE Schema:', Object.keys(nyseData[0]));
        console.log('NYSE Sample:', nyseData[0]);
    }
}

checkTables();
