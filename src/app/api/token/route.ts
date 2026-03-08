import { NextResponse } from 'next/server';
import crypto from 'crypto';

interface TokenRequest {
  theme?: 'light' | 'dark';
  type?: 'technical' | 'sentiment' | 'market-news' | 'risk-calculator' | 
        'performance-stats' | 'calendar' | 'volatility' | 'favorites';
  language?: string;
  showAll?: boolean;
  backgroundColor?: string;
  width?: string;
  height?: string;
}

export async function POST(request: Request) {
  try {
    const { 
      theme = 'light', 
      type = 'technical', 
      language = 'en',
      showAll = true,
      backgroundColor,
      width,
      height
    } = await request.json() as TokenRequest;

    // Configuration - should be environment variables in production
    const config = {
      brokerId: process.env.AUTOCHARTIST_BROKER_ID || '997',
      secretKey: process.env.AUTOCHARTIST_SECRET_KEY || '77f0fe5cca6b',
      userId: process.env.AUTOCHARTIST_USER_ID || 'Zuperior',
      accountType: (process.env.AUTOCHARTIST_ACCOUNT_TYPE || 'LIVE') as 'LIVE' | 'DEMO',
      locale: language === 'en' ? 'en_GB' : language,
      layout: 'horizontal',
      tradeNow: 'n'
    };

    // Validate required config
    if (!config.brokerId || !config.secretKey || !config.userId) {
      throw new Error('Missing required configuration');
    }

    // Generate token with 5 minutes expiry
    const expiry = Math.floor(Date.now() / 1000) + 300; // 5 minutes
    const accountTypeValue = config.accountType === 'LIVE' ? '0' : '1';
    const tokenString = `${config.userId}|${accountTypeValue}|${expiry}${config.secretKey}`;
    const token = crypto.createHash('md5').update(tokenString).digest('hex');

    // Common parameters for all URLs
    const commonParams: Record<string, string> = {
      broker_id: config.brokerId,
      token: token,
      expire: expiry.toString(),
      user: config.userId,
      account_type: config.accountType,
    };

    // Add timestamp to prevent caching
    commonParams._t = Date.now().toString();

    let url: string;
    
    // Base theme parameters for all chart types
    const themeParams: Record<string, string> = {
      theme: theme,
    };

    // Add style parameter for dark theme
    if (theme === 'dark') {
      themeParams.style = 'ds';
    }

    // Add custom background color if provided
    if (backgroundColor) {
      themeParams.background = backgroundColor;
      themeParams.backgroundColor = backgroundColor;
    }

    // Add dimensions if provided
    if (width) themeParams.width = width;
    if (height) themeParams.height = height;

    // Chart style configurations for different themes
    const chartStyles = {
      dark: {
        favorites: 'AAz_AAAA_______MzMz_________________o1yi______-jXKL_YkKl______9iQqX______6Ncov______YkKl____________AAAA_xsCLv8kSiz_o1yi_7M8AAAJTS9kIEhIOm1tAAZkL00veXkACiMsIyMwLjAwMDAABUFyaWFs_wAA______________________8BAQH_SHax_2Sxiv__gEAAAAAAAAAAAAAAQCAAAABKaHR0cHM6Ly9icm9rZXJzbG9nb3MuYXV0b2NoYXJ0aXN0LmNvbS9jdXN0b20tY2hhcnRzL2RhcmstenVwZXJpb3ItbG9nby5wbmc-TMzNAA1NaWRkbGUgQ2VudGVyP4AAAAAAAAAAAAAAABBhdXRvY2hhcnRpc3QuY29t__-AQAAAAAEAAAAAAf__gED__4BA__-AQP8bAi4_gAAAP4AAAD-AAAA_gAAAP4AAAD-AAAA_gAAAP4AAAD-AAAA_gAAAP4AAAD-AAAA_gAAAP4AAAD5MzM0_gAAAAAAAAAAAAAAAAAAMAAAADAAAAAAAAAAAAAAAAA4AAAASAQ',
        volatility: 'AAz_AAAA_______MzMz_________________o1yi______-jXKL_YkKl______9iQqX______6Ncov______YkKl____________AAAA_2JCpf8kSiz_o1yi_7M8AAAJTS9kIEhIOm1tAAZkL00veXkACiMsIyMwLjAwMDAABUFyaWFs_wAA______________________8BAQH_SHax_2Sxiv__gED_AAAAAAA_gAAAQCAAAABKaHR0cHM6Ly9icm9rZXJzbG9nb3MuYXV0b2NoYXJ0aXN0LmNvbS9jdXN0b20tY2hhcnRzL2RhcmstenVwZXJpb3ItbG9nby5wbmc-TMzNAA1NaWRkbGUgQ2VudGVyP4AAAAAAAAAAAAAAABBhdXRvY2hhcnRpc3QuY29t__-AQAAAAAEAAAAAAf__gED__4BA__-AQP8bAi4AAAAAP4AAAD-AAAA_gAAAP4AAAD-AAAA_gAAAP4AAAD-AAAA_gAAAP4AAAD-AAAA_gAAAP4AAAD5MzM0_gAAAAAAAAAAAAAAAAAAMAAAADAAAAAAAAAAAAAAAAA4AAAASAQ'
      },
      light: {
        favorites: 'AAz_AAAA_______MzMz_________________o1yi______-jXKL_YkKl______9iQqX______6Ncov______YkKl____________AAAA_2JCpf8kSiz_o1yi_7M8AAAJTS9kIEhIOm1tAAZkL00veXkACiMsIyMwLjAwMDAABUFyaWFs_wAA______________________8BAQH_SHax_2Sxiv__gEAAAAAAA_gAAAQCAAAABKaHR0cHM6Ly9icm9rZXJzbG9nb3MuYXV0b2NoYXJ0aXN0LmNvbS9jdXN0b20tY2hhcnRzL3p1cGVyaW9yLWxvZ28ucG5nP4MzMwANUkVHVUxBUixOb3JtYWw_QAAAAAAAAAAAAAAAABBhdXRvY2hhcnRpc3QuY29t__-AQAAAAAEAAAAAAf__gED__4BA__-AQP8bAi4_gAAAP4AAAD-AAAA_gAAAP4AAAD-AAAA_gAAAP4AAAD-AAAA_gAAAP4AAAD-AAAA_gAAAP4AAAD5MzM0_gAAAAAAAAAAAAAAAAAAMAAAADAAAAAAAAAAAAAAAAA4AAAASAQ',
        volatility: 'AAz_AAAA_______MzMz_________________o1yi______-jXKL_YkKl______9iQqX______6Ncov______YkKl____________AAAA_2JCpf8kSiz_o1yi_7M8AAAJTS9kIEhIOm1tAAZkL00veXkACiMsIyMwLjAwMDAABUFyaWFs_wAA______________________8BAQH_SHax_2Sxiv__gEAAAAAAA_gAAAQCAAAABKaHR0cHM6Ly9icm9rZXJzbG9nb3MuYXV0b2NoYXJ0aXN0LmNvbS9jdXN0b20tY2hhcnRzL3p1cGVyaW9yLWxvZ28ucG5nP4MzMwANUkVHVUxBUixOb3JtYWw_QAAAAAAAAAAAAAAAABBhdXRvY2hhcnRpc3QuY29t__-AQAAAAAEAAAAAAf__gED__4BA__-AQP8bAi4_gAAAP4AAAD-AAAA_gAAAP4AAAD-AAAA_gAAAP4AAAD-AAAA_gAAAP4AAAD-AAAA_gAAAP4AAAD5MzM0_gAAAAAAAAAAAAAAAAAAMAAAADAAAAAAAAAAAAAAAAA4AAAASAQ'
      }
    };

    switch (type) {
      case 'sentiment':
        // News Sentiment URL
        const sentimentParams = new URLSearchParams({
          ...commonParams,
          ...themeParams,
          language: language,
          locale: config.locale
        });
        
        // Add CSS for sentiment widget
        sentimentParams.append('css', 
          theme === 'dark' 
            ? `https://broker-resources.autochartist.com/css/components/${config.brokerId}-sentiment_ds.css`
            : `https://broker-resources.autochartist.com/css/components/${config.brokerId}-sentiment.css`
        );
        
        url = `https://news-sentiment.autochartist.com/news-sentiment?${sentimentParams.toString()}`;
        break;

      case 'market-news':
        // Market News URL
        const marketNewsParams = new URLSearchParams({
          ...commonParams,
          ...themeParams,
          locale: language
        });
        
        // Add CSS based on theme
        marketNewsParams.append('css', 
          theme === 'dark' 
            ? `https://broker-resources.autochartist.com/css/components/${config.brokerId}-news-feeds-app_ds.css`
            : `https://broker-resources.autochartist.com/css/components/${config.brokerId}-news-feeds-app.css`
        );
        
        url = `https://component.autochartist.com/news/stock-news?${marketNewsParams.toString()}`;
        break;

      case 'risk-calculator':
        // Risk Calculator URL
        const riskCalcParams = new URLSearchParams({
          ...commonParams,
          ...themeParams,
          locale: language
        });
        
        riskCalcParams.append('css', 
          theme === 'dark'
            ? `https://broker-resources.autochartist.com/css/components/${config.brokerId}-rc-app_ds.css`
            : `https://broker-resources.autochartist.com/css/components/${config.brokerId}-rc-app.css`
        );
        
        url = `https://component.autochartist.com/rc/?${riskCalcParams.toString()}#!/`;
        break;

      case 'performance-stats':
        // Performance Statistics URL
        const perfStatsParams = new URLSearchParams({
          broker_id: config.brokerId,
          user: config.userId,
          account_type: config.accountType,
          expire: expiry.toString(),
          locale: config.locale,
          token: token,
          ...themeParams
        });
        
        perfStatsParams.append('css', 
          theme === 'dark'
            ? 'https://perfstats.autochartist.com/performance-stats-v3/css/performance_stats_v3_ds.css'
            : 'https://perfstats.autochartist.com/performance-stats-v3/css/performance_stats_v3.css'
        );
        
        url = `https://perfstats.autochartist.com/performance-stats-v3/?${perfStatsParams.toString()}`;
        break;

      // case 'calendar':
      //   // Calendar URL
      //   const calendarParams = new URLSearchParams({
      //     ...commonParams,
      //     ...themeParams,
      //     showall: showAll.toString(),
      //     locale: language
      //   });
        
      //   url = `https://eia.autochartist.com/calendar/?${calendarParams.toString()}#!/calendar`;
      //   break;
case 'calendar':
    // Corrected Calendar URL based on your examples
    const calendarParams = new URLSearchParams({
        broker_id: config.brokerId,
        showall: showAll.toString(),
        nextdays: '3', // 👈 IMPORTANT: Added the missing parameter with a default value
        token: token,
        expire: expiry.toString(),
        user: config.userId,
        locale: language, // 👈 Use 'locale' (matches your example), not 'locale'
    });

    // Add theme/style parameter for dark mode
    if (theme === 'dark') {
        calendarParams.append('style', 'ds'); // 👈 Append 'style=ds' for dark theme
    }

    // Construct the final URL. The hash fragment #!/calendar comes after the query string.
    url = `https://eia.autochartist.com/calendar/?${calendarParams.toString()}#!/calendar`;
    break;
      case 'volatility':
        // Volatility Analysis URL
        const volatilityParams = new URLSearchParams({
          ...commonParams,
          ...themeParams,
          locale: language === 'en' ? 'en-GB' : language
        });
        
        // Add chart style based on theme
        volatilityParams.append('chart_style', chartStyles[theme].volatility);
        
        url = `https://component.autochartist.com/va/#/results?${volatilityParams.toString()}`;
        break;

      case 'favorites':
        // Our Favourites URL
        const favoritesParams = new URLSearchParams({
          ...commonParams,
          ...themeParams,
          locale: language === 'en' ? 'en-GB' : language
        });
        
        // Add chart style based on theme
        favoritesParams.append('chart_style', chartStyles[theme].favorites);
        
        url = `https://component.autochartist.com/of/?${favoritesParams.toString()}#/`;
        break;

      default:
        // Technical Analysis URL (default)
        const techParams = new URLSearchParams({
          ...commonParams,
          ...themeParams,
          locale: config.locale,
          layout: config.layout,
          trade_now: config.tradeNow,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
        });
        
        // Add technical analysis specific parameters
        if (theme === 'dark') {
          techParams.append('chart_style', 'dark');
        }
        
        url = `https://component.autochartist.com/to/?${techParams.toString()}#/results`;
    }

    // Return URL with CORS headers
    return NextResponse.json(
      { url },
      {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
        },
      }
    );

  } catch (error) {
    console.error('Autochartist token error:', error);
    
    // Return more detailed error in development
    const errorMessage = process.env.NODE_ENV === 'development' 
      ? `Failed to generate Autochartist URL: ${error instanceof Error ? error.message : 'Unknown error'}`
      : 'Failed to generate Autochartist URL';
    
    return NextResponse.json(
      { error: errorMessage },
      { 
        status: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
        }
      }
    );
  }
}

// Add OPTIONS method for CORS preflight
export async function OPTIONS() {
  return NextResponse.json(
    {},
    {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Max-Age': '86400', // 24 hours
      },
    }
  );
}