import React, { useEffect, useRef, memo } from 'react';

function TradingViewSymbolInfo({ symbol, exchange, theme }) {
  const container = useRef();

  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://s3.tradingview.com/external-embedding/embed-widget-single-quote.js";
    script.type = "text/javascript";
    script.async = true;

    const exchangeMap = {
      'nasdaq_stock_data': 'NASDAQ',
      'nyse_stock_data': 'NYSE',
      'lse_stock_data': 'LSE',
      'fse_stock_data': 'FSE'
    };

    const tradingViewSymbol = `${exchangeMap[exchange] || 'NASDAQ'}:${symbol}`;

    script.innerHTML = `
      {
        "symbol": "${tradingViewSymbol}",
        "width": "100%",
        "colorTheme": "${theme || 'dark'}",
        "isTransparent": false,
        "locale": "en"
      }`;

    if (container.current) {
      container.current.innerHTML = '';
    }
    container.current.appendChild(script);

    return () => {
      if (container.current) {
        container.current.innerHTML = '';
      }
    };
  }, [symbol, exchange, theme]);

  return (
    <div className="tradingview-widget-container" ref={container} style={{ height: '100px', width: '100%' }}>
      <div className="tradingview-widget-container__widget"></div>
      <div className="tradingview-widget-copyright">
        <a href="https://www.tradingview.com/" rel="noopener nofollow" target="_blank">
          <span className="blue-text">Track all markets on TradingView</span>
        </a>
      </div>
    </div>
  );
}

export default memo(TradingViewSymbolInfo);