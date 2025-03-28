import { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'
import { Link as RouterLink } from 'react-router-dom'
import {
  Box,
  Container,
  VStack,
  Text,
  Heading,
  useColorModeValue,
  Card,
  CardBody,
  SimpleGrid,
  Progress,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Button,
  Flex,
  Spinner,
  Center,
  HStack,
  useColorMode,
  IconButton,
  Spacer,
} from '@chakra-ui/react'
import { 
  SunIcon, 
  MoonIcon,
  ViewIcon,
} from '@chakra-ui/icons'

function History() {
  const { colorMode, toggleColorMode } = useColorMode()
  const [loading, setLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState(null)
  const CACHE_KEY = 'marketStatsCache'
  const CACHE_EXPIRY = 15 * 60 * 1000 // 15 minutes in milliseconds

  const initialStats = {
    nasdaq: {
      buy: { 
        success: 0, 
        total: 0, 
        upwardChange: 0,
        downwardChange: 0,
        upCount: 0,
        downCount: 0
      },
      weak_buy: { 
        success: 0, 
        total: 0, 
        upwardChange: 0,
        downwardChange: 0,
        upCount: 0,
        downCount: 0
      },
      strong_sell: { 
        success: 0, 
        total: 0, 
        upwardChange: 0,
        downwardChange: 0,
        upCount: 0,
        downCount: 0
      },
      sell: { 
        success: 0, 
        total: 0, 
        upwardChange: 0,
        downwardChange: 0,
        upCount: 0,
        downCount: 0
      }
    },
    nyse: {
      buy: { 
        success: 0, 
        total: 0, 
        upwardChange: 0,
        downwardChange: 0,
        upCount: 0,
        downCount: 0
      },
      weak_buy: { 
        success: 0, 
        total: 0, 
        upwardChange: 0,
        downwardChange: 0,
        upCount: 0,
        downCount: 0
      },
      strong_sell: { 
        success: 0, 
        total: 0, 
        upwardChange: 0,
        downwardChange: 0,
        upCount: 0,
        downCount: 0
      },
      sell: { 
        success: 0, 
        total: 0, 
        upwardChange: 0,
        downwardChange: 0,
        upCount: 0,
        downCount: 0
      }
    },
    lse: {
      buy: { 
        success: 0, 
        total: 0, 
        upwardChange: 0,
        downwardChange: 0,
        upCount: 0,
        downCount: 0
      },
      weak_buy: { 
        success: 0, 
        total: 0, 
        upwardChange: 0,
        downwardChange: 0,
        upCount: 0,
        downCount: 0
      },
      strong_sell: { 
        success: 0, 
        total: 0, 
        upwardChange: 0,
        downwardChange: 0,
        upCount: 0,
        downCount: 0
      },
      sell: { 
        success: 0, 
        total: 0, 
        upwardChange: 0,
        downwardChange: 0,
        upCount: 0,
        downCount: 0
      }
    },
    fse: {
      buy: { 
        success: 0, 
        total: 0, 
        upwardChange: 0,
        downwardChange: 0,
        upCount: 0,
        downCount: 0
      },
      weak_buy: { 
        success: 0, 
        total: 0, 
        upwardChange: 0,
        downwardChange: 0,
        upCount: 0,
        downCount: 0
      },
      strong_sell: { 
        success: 0, 
        total: 0, 
        upwardChange: 0,
        downwardChange: 0,
        upCount: 0,
        downCount: 0
      },
      sell: { 
        success: 0, 
        total: 0, 
        upwardChange: 0,
        downwardChange: 0,
        upCount: 0,
        downCount: 0
      }
    }
  }

  const ratingLabels = {
    buy: 'Buy',
    weak_buy: 'Weak Buy',
    strong_sell: 'Strong Sell',
    sell: 'Sell'
  }

  const bgColor = useColorModeValue('gray.50', '#000000')
  const cardBgColor = useColorModeValue('white', '#121212')
  const textColor = useColorModeValue('gray.800', '#ffffff')
  const mutedTextColor = useColorModeValue('gray.600', '#888888')
  const borderColor = useColorModeValue('gray.200', '#202020')
  const hoverBgColor = useColorModeValue('gray.50', '#1c1c1c')
  const positiveColor = useColorModeValue('green.500', '#00873c')
  const negativeColor = useColorModeValue('red.500', '#ff4d4d')
  const navBgColor = useColorModeValue('white', '#121212')

  const fetchExchangeData = async (exchange, offset = 0, limit = 1000) => {
    const { data, error, count } = await supabase
      .from(exchange.table)
      .select('symbol, rating, current_price, prediction_date, expected_return', { count: 'exact' })
      .range(offset, offset + limit - 1)

    if (error) {
      console.error(`Error fetching ${exchange.name}:`, error)
      return { data: [], count: 0 }
    }

    return { data, count }
  }

  const validatePrediction = (rating, currentPrice, previousPrice) => {
    const priceChange = ((currentPrice - previousPrice) / previousPrice) * 100
    
    if (rating.includes('buy')) {
      return priceChange > 0
    }
    
    if (rating.includes('sell')) {
      return priceChange < 0
    }

    return false
  }

  const processSymbolData = (predictions, marketStats, exchange) => {
    predictions.sort((a, b) => new Date(a.prediction_date) - new Date(b.prediction_date))

    const predictionsByDate = {}
    predictions.forEach(pred => {
      if (pred.rating) {
        if (pred.rating.toLowerCase() === 'strong_buy') {
          pred.rating = 'buy'
        } else if (pred.rating.toLowerCase() === 'weak_sell') {
          pred.rating = 'sell'
        }
      }

      const dateKey = new Date(pred.prediction_date).toISOString().split('T')[0]
      if (!predictionsByDate[dateKey]) {
        predictionsByDate[dateKey] = []
      }
      predictionsByDate[dateKey].push(pred)
    })

    const dates = Object.keys(predictionsByDate).sort()
    
    for (let i = 0; i < dates.length - 1; i++) {
      const currentDate = dates[i]
      const nextDate = dates[i + 1]
      
      const currentPredictions = predictionsByDate[currentDate]
      const nextPredictions = predictionsByDate[nextDate]

      currentPredictions.forEach(current => {
        const next = nextPredictions.find(p => p.symbol === current.symbol)
        if (!next) return

        if (!current?.current_price || !next?.current_price || !current?.rating) {
          return
        }

        const rating = current.rating.toLowerCase().replace(/\s+/g, '_')
        if (!marketStats[exchange.name][rating]) return

        const priceChange = ((next.current_price - current.current_price) / current.current_price) * 100
        
        marketStats[exchange.name][rating].total++

        if (priceChange > 0) {
          marketStats[exchange.name][rating].upwardChange += priceChange
          marketStats[exchange.name][rating].upCount++
        } else {
          marketStats[exchange.name][rating].downwardChange += priceChange
          marketStats[exchange.name][rating].downCount++
        }

        if (validatePrediction(rating, next.current_price, current.current_price)) {
          marketStats[exchange.name][rating].success++
        }
      })
    }
  }

  const [marketStats, setMarketStats] = useState(() => {
    const cached = localStorage.getItem(CACHE_KEY)
    if (cached) {
      const { data, timestamp } = JSON.parse(cached)
      const age = Date.now() - timestamp
      if (age < CACHE_EXPIRY) {
        setLastUpdated(new Date(timestamp))
        return data
      }
    }
    return initialStats
  })

  const saveToCache = (data) => {
    const timestamp = Date.now()
    localStorage.setItem(CACHE_KEY, JSON.stringify({
      data,
      timestamp
    }))
    setLastUpdated(new Date(timestamp))
  }

  const fetchData = async () => {
    setLoading(true)
    try {
      const cached = localStorage.getItem(CACHE_KEY)
      if (cached) {
        const { data, timestamp } = JSON.parse(cached)
        const age = Date.now() - timestamp
        if (age < CACHE_EXPIRY) {
          console.log('Using cached data from:', new Date(timestamp))
          setMarketStats(data)
          setLastUpdated(new Date(timestamp))
          setLoading(false)
          return
        }
      }

      const exchanges = [
        { name: 'nasdaq', table: 'nasdaq_stock_data' },
        { name: 'nyse', table: 'nyse_stock_data' },
        { name: 'lse', table: 'lse_stock_data' },
        { name: 'fse', table: 'fse_stock_data' }
      ]

      const newMarketStats = { ...initialStats }

      for (const exchange of exchanges) {
        console.log(`Fetching data for ${exchange.name}...`)
        
        let allData = []
        let offset = 0
        let hasMore = true
        let totalCount = 0

        while (hasMore) {
          console.log(`Fetching batch at offset ${offset} for ${exchange.name}...`)
          const { data: batch, count } = await fetchExchangeData(exchange, offset)
          
          if (!batch || batch.length === 0) {
            hasMore = false
            continue
          }

          allData = allData.concat(batch)
          totalCount = count

          offset += batch.length
          if (allData.length >= totalCount) {
            hasMore = false
          }

          console.log(`Progress: ${allData.length}/${totalCount} records (${((allData.length/totalCount)*100).toFixed(1)}%)`)
        }

        console.log(`Processing data for ${exchange.name}...`)

        const symbolData = {}
        allData.forEach(row => {
          if (!symbolData[row.symbol]) {
            symbolData[row.symbol] = []
          }
          symbolData[row.symbol].push(row)
        })

        const symbolCount = Object.keys(symbolData).length
        console.log(`Processing ${symbolCount} symbols for ${exchange.name}`)
        
        let processedCount = 0
        Object.entries(symbolData).forEach(([symbol, predictions]) => {
          processSymbolData(predictions, newMarketStats, exchange)
          processedCount++
          if (processedCount % 100 === 0) {
            console.log(`Processed ${processedCount}/${symbolCount} symbols (${((processedCount/symbolCount)*100).toFixed(1)}%)`)
          }
        })

        Object.keys(newMarketStats[exchange.name]).forEach(rating => {
          const stats = newMarketStats[exchange.name][rating]
          const avgUpChange = stats.upCount > 0 
            ? (stats.upwardChange / stats.upCount).toFixed(2)
            : 0
          const avgDownChange = stats.downCount > 0 
            ? (stats.downwardChange / stats.downCount).toFixed(2)
            : 0
          console.log(`${exchange.name} ${rating}: ${stats.success}/${stats.total} (${(stats.success/stats.total*100).toFixed(2)}%) avg up: ${avgUpChange}% avg down: ${avgDownChange}%`)
        })

        console.log(`Completed processing ${exchange.name}:`, newMarketStats[exchange.name])
      }

      setMarketStats(newMarketStats)
      saveToCache(newMarketStats)
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  return (
    <Box minH="100vh" bg={bgColor}>
      <Box bg={navBgColor} py={4} px={8} shadow="sm" position="sticky" top={0} zIndex={10}>
        <Flex justify="space-between" align="center">
          <RouterLink to="/">
            <Heading size="md" color={textColor}>Stock Analysis</Heading>
          </RouterLink>
          <IconButton
            icon={colorMode === 'light' ? <MoonIcon /> : <SunIcon />}
            onClick={toggleColorMode}
            variant="ghost"
            aria-label="Toggle color mode"
          />
        </Flex>
      </Box>

      <Container maxW="8xl" py={8}>
        <VStack spacing={8} align="stretch">
          <Flex justify="space-between" align="center">
            <Heading size="lg" color={textColor}>Performance History</Heading>
            <HStack spacing={4}>
              {lastUpdated && (
                <Text fontSize="sm" color={mutedTextColor}>
                  Last updated: {lastUpdated.toLocaleString()}
                </Text>
              )}
              <Button
                size="sm"
                leftIcon={<ViewIcon />}
                onClick={fetchData}
                isLoading={loading}
                colorScheme="blue"
              >
                Refresh Data
              </Button>
            </HStack>
          </Flex>

          {/* Exchange Cards */}
          <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={8}>
            {Object.entries(marketStats).map(([exchange, stats]) => (
              <Card
                key={exchange}
                overflow="hidden"
                variant="elevated"
                bg={cardBgColor}
                borderRadius="xl"
                shadow="xl"
              >
                <Box p={1} bgGradient="linear(to-r, blue.400, teal.400)" />
                <CardBody p={6}>
                  <Heading 
                    size="lg" 
                    mb={6} 
                    textTransform="uppercase"
                    letterSpacing="wide"
                    color={textColor}
                    textAlign="center"
                    pb={4}
                    borderBottom="2px solid"
                    borderColor={borderColor}
                  >
                    {exchange.toUpperCase()}
                  </Heading>
                  
                  <VStack spacing={6} align="stretch">
                    {Object.entries(stats).map(([rating, data]) => {
                      const successRate = data.total > 0 
                        ? (data.success / data.total * 100).toFixed(1)
                        : 0

                      const avgUpChange = data.upCount > 0 
                        ? (data.upwardChange / data.upCount).toFixed(2)
                        : 0

                      const avgDownChange = data.downCount > 0 
                        ? (data.downwardChange / data.downCount).toFixed(2)
                        : 0
                      
                      return (
                        <Box 
                          key={rating} 
                          p={4} 
                          borderRadius="lg" 
                          bg={useColorModeValue('gray.50', 'whiteAlpha.50')}
                        >
                          {/* Rating Header */}
                          <Flex justify="space-between" align="center" mb={4}>
                            <Heading size="md" color={textColor}>
                              {ratingLabels[rating]}
                            </Heading>
                            <Box textAlign="right">
                              <Text 
                                fontSize="2xl"
                                fontWeight="bold"
                                color={successRate >= 50 ? positiveColor : negativeColor}
                              >
                                {successRate}%
                              </Text>
                              <Text fontSize="sm" color={mutedTextColor}>
                                Success Rate
                              </Text>
                            </Box>
                          </Flex>

                          {/* Progress Bar */}
                          <Progress 
                            value={successRate}
                            size="sm"
                            colorScheme={successRate >= 50 ? "green" : "red"}
                            mb={4}
                            borderRadius="full"
                            hasStripe
                            isAnimated
                          />

                          {/* Stats Grid */}
                          <SimpleGrid columns={2} spacing={4} mt={4}>
                            {/* Upward Movement Stats */}
                            <Box 
                              p={3} 
                              borderRadius="md" 
                              bg={useColorModeValue('white', 'whiteAlpha.100')}
                              border="1px solid"
                              borderColor={borderColor}
                            >
                              <Text fontSize="sm" color={mutedTextColor} mb={1}>Upward Movement</Text>
                              <Text fontSize="xl" fontWeight="bold" color={positiveColor}>
                                +{avgUpChange}%
                              </Text>
                              <Text fontSize="sm" color={mutedTextColor}>
                                {data.upCount} stocks
                              </Text>
                            </Box>

                            {/* Downward Movement Stats */}
                            <Box 
                              p={3} 
                              borderRadius="md" 
                              bg={useColorModeValue('white', 'whiteAlpha.100')}
                              border="1px solid"
                              borderColor={borderColor}
                            >
                              <Text fontSize="sm" color={mutedTextColor} mb={1}>Downward Movement</Text>
                              <Text fontSize="xl" fontWeight="bold" color={negativeColor}>
                                {avgDownChange}%
                              </Text>
                              <Text fontSize="sm" color={mutedTextColor}>
                                {data.downCount} stocks
                              </Text>
                            </Box>
                          </SimpleGrid>

                          {/* Total Predictions */}
                          <Text 
                            mt={4} 
                            fontSize="sm" 
                            color={mutedTextColor}
                            textAlign="center"
                          >
                            Total Predictions: {data.total} | Successful: {data.success}
                          </Text>
                        </Box>
                      )
                    })}
                  </VStack>
                </CardBody>
              </Card>
            ))}
          </SimpleGrid>
        </VStack>

        {loading && (
          <Center mt={8} p={8}>
            <VStack spacing={4}>
              <Spinner size="xl" thickness="4px" speed="0.65s" color="blue.500" />
              <Text color={mutedTextColor}>Loading performance data...</Text>
            </VStack>
          </Center>
        )}
      </Container>
    </Box>
  )

}

export default History
