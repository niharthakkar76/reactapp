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
  const [marketStats, setMarketStats] = useState({
    nasdaq: {
      buy: { success: 0, total: 0, avgChange: 0 },
      weak_buy: { success: 0, total: 0, avgChange: 0 },
      strong_sell: { success: 0, total: 0, avgChange: 0 },
      sell: { success: 0, total: 0, avgChange: 0 }
    },
    nyse: {
      buy: { success: 0, total: 0, avgChange: 0 },
      weak_buy: { success: 0, total: 0, avgChange: 0 },
      strong_sell: { success: 0, total: 0, avgChange: 0 },
      sell: { success: 0, total: 0, avgChange: 0 }
    },
    lse: {
      buy: { success: 0, total: 0, avgChange: 0 },
      weak_buy: { success: 0, total: 0, avgChange: 0 },
      strong_sell: { success: 0, total: 0, avgChange: 0 },
      sell: { success: 0, total: 0, avgChange: 0 }
    },
    fse: {
      buy: { success: 0, total: 0, avgChange: 0 },
      weak_buy: { success: 0, total: 0, avgChange: 0 },
      strong_sell: { success: 0, total: 0, avgChange: 0 },
      sell: { success: 0, total: 0, avgChange: 0 }
    }
  })

  const ratingLabels = {
    buy: 'Buy',
    weak_buy: 'Weak Buy',
    strong_sell: 'Strong Sell',
    sell: 'Sell'
  }

  // Color theme values
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
    // Remove order by prediction_date to get all historical data
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
    
    // For buy signals, prediction is correct if price went up
    if (rating.includes('buy')) {
      return priceChange > 0
    }
    
    // For sell signals, prediction is correct if price went down
    if (rating.includes('sell')) {
      return priceChange < 0
    }

    return false
  }

  const processSymbolData = (predictions, marketStats, exchange) => {
    // Sort predictions by date ascending to process them in chronological order
    predictions.sort((a, b) => new Date(a.prediction_date) - new Date(b.prediction_date))

    // Group predictions by date to handle multiple predictions per day
    const predictionsByDate = {}
    predictions.forEach(pred => {
      // Convert strong_buy to buy and weak_sell to sell
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
    
    // Process each day's predictions
    for (let i = 0; i < dates.length - 1; i++) {
      const currentDate = dates[i]
      const nextDate = dates[i + 1]
      
      const currentPredictions = predictionsByDate[currentDate]
      const nextPredictions = predictionsByDate[nextDate]

      // Process each prediction for the current date
      currentPredictions.forEach(current => {
        // Find matching symbol in next day's predictions
        const next = nextPredictions.find(p => p.symbol === current.symbol)
        if (!next) return

        if (!current?.current_price || !next?.current_price || !current?.rating) {
          return
        }

        const rating = current.rating.toLowerCase().replace(/\s+/g, '_')
        if (!marketStats[exchange.name][rating]) return

        const priceChange = ((next.current_price - current.current_price) / current.current_price) * 100
        
        marketStats[exchange.name][rating].total++
        marketStats[exchange.name][rating].totalChange += Math.abs(priceChange)

        // Simple validation - just check price movement direction
        if (validatePrediction(rating, next.current_price, current.current_price)) {
          marketStats[exchange.name][rating].success++
        }
      })
    }
  }

  const fetchData = async () => {
    setLoading(true)
    try {
      const exchanges = [
        { name: 'nasdaq', table: 'nasdaq_stock_data' },
        { name: 'nyse', table: 'nyse_stock_data' },
        { name: 'lse', table: 'lse_stock_data' },
        { name: 'fse', table: 'fse_stock_data' }
      ]

      const newMarketStats = { ...marketStats }

      for (const exchange of exchanges) {
        console.log(`Fetching data for ${exchange.name}...`)
        
        // Initialize exchange stats with only the categories we want
        newMarketStats[exchange.name] = {
          buy: { success: 0, total: 0, totalChange: 0 },
          weak_buy: { success: 0, total: 0, totalChange: 0 },
          strong_sell: { success: 0, total: 0, totalChange: 0 },
          sell: { success: 0, total: 0, totalChange: 0 }
        }

        let allData = []
        let offset = 0
        let hasMore = true
        let totalCount = 0

        // Fetch all data in batches
        while (hasMore) {
          console.log(`Fetching batch at offset ${offset} for ${exchange.name}...`)
          const { data: batch, count } = await fetchExchangeData(exchange, offset)
          
          if (!batch || batch.length === 0) {
            hasMore = false
            continue
          }

          allData = [...allData, ...batch]
          offset += batch.length
          totalCount = count

          if (offset >= count) {
            hasMore = false
          }

          // Log progress
          console.log(`Progress: ${allData.length}/${totalCount} records (${((allData.length/totalCount)*100).toFixed(1)}%)`)
        }

        console.log(`Received total ${allData.length} records for ${exchange.name}`)

        // Group by symbol
        const symbolData = {}
        allData.forEach(row => {
          if (!symbolData[row.symbol]) {
            symbolData[row.symbol] = []
          }
          symbolData[row.symbol].push({
            ...row,
            prediction_date: new Date(row.prediction_date)
          })
        })

        const symbolCount = Object.keys(symbolData).length
        console.log(`Processing ${symbolCount} symbols for ${exchange.name}`)
        
        let processedCount = 0
        // Process each symbol's historical data
        Object.entries(symbolData).forEach(([symbol, predictions]) => {
          processSymbolData(predictions, newMarketStats, exchange)
          processedCount++
          
          // Log progress every 100 symbols
          if (processedCount % 100 === 0) {
            console.log(`Processed ${processedCount}/${symbolCount} symbols (${((processedCount/symbolCount)*100).toFixed(1)}%)`)
          }
        })

        // Calculate averages and log statistics
        Object.keys(newMarketStats[exchange.name]).forEach(rating => {
          const stats = newMarketStats[exchange.name][rating]
          stats.avgChange = stats.total > 0 
            ? (stats.totalChange / stats.total).toFixed(2)
            : 0
          delete stats.totalChange

          const successRate = stats.total > 0 ? ((stats.success/stats.total)*100).toFixed(2) : 'N/A'
          console.log(`${exchange.name} ${rating}: ${stats.success}/${stats.total} (${successRate}%) avg change: ${stats.avgChange}%`)
        })

        console.log(`Completed processing ${exchange.name}:`, newMarketStats[exchange.name])
      }

      setMarketStats(newMarketStats)
    } catch (error) {
      console.error('Error in fetchData:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  return (
    <Box minH="100vh" bg={bgColor}>
      {/* Navbar */}
      <Box py={2} px={4} bg={navBgColor} borderBottom="1px" borderColor={borderColor} position="sticky" top="0" zIndex="sticky">
        <Flex maxW="container.xl" mx="auto" align="center">
          <RouterLink to="/dashboard">
            <HStack spacing={2}>
              <Text
                fontSize="2xl"
                fontWeight="bold"
                bgGradient="linear(to-r, blue.400, teal.400)"
                bgClip="text"
                _hover={{ 
                  bgGradient: "linear(to-r, blue.500, teal.500)",
                  transform: "scale(1.05)",
                  transition: "all 0.2s ease-in-out"
                }}
              >
                Swift Signal
              </Text>
            </HStack>
          </RouterLink>
          
          <Spacer />

          <HStack spacing={4}>
            <IconButton
              icon={colorMode === 'light' ? <MoonIcon /> : <SunIcon />}
              onClick={toggleColorMode}
              variant="ghost"
              aria-label="Toggle color mode"
              _hover={{ bg: hoverBgColor }}
            />
          </HStack>
        </Flex>
      </Box>

      {/* Main Content */}
      <Container maxW="container.xl" py={8}>
        <VStack spacing={8} align="stretch">
          {/* Header Section */}
          <Box textAlign="center" mb={4}>
            <Heading 
              size="xl" 
              mb={4}
              bgGradient="linear(to-r, blue.400, teal.400)"
              bgClip="text"
            >
              Prediction Performance
            </Heading>
            <Text color={mutedTextColor} fontSize="lg">
              Historical analysis of trading signals across major exchanges
            </Text>
          </Box>

          {/* Stats Grid */}
          <SimpleGrid 
            columns={{ base: 1, md: 2, lg: 4 }} 
            spacing={6}
            sx={{
              '& > div': {
                transform: 'scale(1)',
                transition: 'all 0.2s ease-in-out'
              },
              '& > div:hover': {
                transform: 'scale(1.02)',
                boxShadow: 'xl'
              }
            }}
          >
            {Object.entries(marketStats).map(([exchange, stats]) => (
              <Card
                key={exchange}
                overflow="hidden"
                variant="elevated"
                bg={cardBgColor}
                borderRadius="xl"
              >
                <Box 
                  p={1} 
                  bgGradient="linear(to-r, blue.400, teal.400)"
                />
                <CardBody p={6}>
                  <Heading 
                    size="md" 
                    mb={4} 
                    textTransform="uppercase"
                    letterSpacing="wide"
                  >
                    {exchange}
                  </Heading>
                  
                  <VStack spacing={5} align="stretch">
                    {Object.entries(stats).map(([rating, data]) => {
                      const successRate = data.total > 0 
                        ? (data.success / data.total * 100).toFixed(1)
                        : 0
                      
                      return (
                        <Box key={rating}>
                          <Flex justify="space-between" align="center" mb={2}>
                            <Text 
                              fontWeight="bold" 
                              color={textColor}
                              fontSize="md"
                            >
                              {ratingLabels[rating]}
                            </Text>
                            <Text 
                              color={successRate >= 50 ? positiveColor : negativeColor}
                              fontWeight="bold"
                            >
                              {successRate}%
                            </Text>
                          </Flex>
                          <Progress 
                            value={successRate}
                            size="sm"
                            colorScheme={successRate >= 50 ? "green" : "red"}
                            mb={2}
                            borderRadius="full"
                            hasStripe
                            isAnimated
                          />
                          <Flex justify="space-between" fontSize="sm" color={mutedTextColor}>
                            <Text>Success: {data.success}/{data.total}</Text>
                            <Text>Avg Δ: {data.avgChange}%</Text>
                          </Flex>
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
