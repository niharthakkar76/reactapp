import React, { useEffect, useRef, memo } from 'react';

function TradingViewWidget({ symbol, exchange, theme }) {
  const container = useRef();

  useEffect(
    () => {
      const script = document.createElement("script");
      script.src = "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js";
      script.type = "text/javascript";
      script.async = true;
      
      // Convert exchange name to TradingView format
      const exchangeMap = {
        'nasdaq_predictions': 'NASDAQ',
        'nyse_predictions': 'NYSE',
        'lse_predictions': 'LSE',
        'fse_predictions': 'FSE'
      };
      
      const tradingViewSymbol = `${exchangeMap[exchange] || 'NASDAQ'}:${symbol}`;
      
      script.innerHTML = `
        {
          "autosize": true,
          "symbol": "${tradingViewSymbol}",
          "interval": "D",
          "timezone": "Etc/UTC",
          "theme": "${theme || 'dark'}",
          "style": "1",
          "locale": "en",
          "allow_symbol_change": true,
          "support_host": "https://www.tradingview.com"
        }`;

      // Clear previous content before adding new script
      if (container.current) {
        container.current.innerHTML = '';
      }
      container.current.appendChild(script);
      
      return () => {
        if (container.current) {
          container.current.innerHTML = '';
        }
      };
    },
    [symbol, exchange, theme] // Added theme to dependency array
  );

  return (
    <div className="tradingview-widget-container" ref={container} style={{ height: "100%", width: "100%" }}>
      <div className="tradingview-widget-container__widget" style={{ height: "calc(100% - 32px)", width: "100%" }}></div>
      <div className="tradingview-widget-copyright"><a href="https://www.tradingview.com/" rel="noopener nofollow" target="_blank"><span className="blue-text">Track all markets on TradingView</span></a></div>
    </div>
  );
}

export default memo(TradingViewWidget);
