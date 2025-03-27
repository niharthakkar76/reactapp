import { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'
import {
  Box,
  Container,
  VStack,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Text,
  Heading,
  useColorModeValue,
  Badge,
  Input,
  InputGroup,
  InputLeftElement,
  Flex,
  Stat,
  StatLabel,
  StatNumber,
  StatGroup,
  Card,
  CardBody,
  SimpleGrid,
  Progress,
  Tooltip,
  Select,
  HStack,
  IconButton,
  Button,
} from '@chakra-ui/react'
import { SearchIcon, ArrowBackIcon, ViewIcon } from '@chakra-ui/icons'
import { Link as RouterLink } from 'react-router-dom'

function History() {
  const [data, setData] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)
  const [selectedExchange, setSelectedExchange] = useState('all')
  const [aggregateStats, setAggregateStats] = useState({
    totalBuySignals: 0,
    successfulBuySignals: 0,
    totalSellSignals: 0,
    successfulSellSignals: 0
  })

  // Colors
  const bgColor = useColorModeValue('gray.50', '#000000')
  const cardBgColor = useColorModeValue('white', '#121212')
  const textColor = useColorModeValue('gray.800', '#ffffff')
  const mutedTextColor = useColorModeValue('gray.600', '#888888')
  const borderColor = useColorModeValue('gray.200', '#202020')
  const positiveColor = useColorModeValue('green.500', '#00873c')
  const negativeColor = useColorModeValue('red.500', '#ff4d4d')

  const fetchData = async () => {
    setLoading(true);
    try {
      let data = [];
      
      if (selectedExchange === 'all') {
        // Fetch data from each exchange
        const exchanges = [
          'nasdaq_stock_data',
          'nyse_stock_data',
          'lse_stock_data',
          'fse_stock_data'
        ];

        for (const exchange of exchanges) {
          const { data: exchangeData, error } = await supabase
            .from(exchange)
            .select('*')
            .order('prediction_date', { ascending: true });

          if (error) {
            console.error(`Error fetching ${exchange}:`, error);
            continue;
          }

          if (exchangeData && exchangeData.length > 0) {
            console.log(`${exchange} data:`, exchangeData[0]); // Log sample data
            const processedData = processExchangeData(exchangeData, exchange);
            data = [...data, ...processedData];
          }
        }
      } else {
        // Fetch data for specific exchange
        const { data: exchangeData, error } = await supabase
          .from(selectedExchange)
          .select('*')
          .order('prediction_date', { ascending: true });

        if (error) throw error;

        if (exchangeData) {
          data = processExchangeData(exchangeData, selectedExchange);
        }
      }

      if (searchTerm) {
        data = data.filter(item => 
          item.symbol.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }

      if (data.length > 0) {
        const sortedData = sortData(data);
        setData(sortedData);
        setAggregateStats(calculateStats(sortedData));
      } else {
        setData([]);
        setAggregateStats({
          totalBuySignals: 0,
          successfulBuySignals: 0,
          totalSellSignals: 0,
          successfulSellSignals: 0
        });
      }
    } catch (error) {
      console.error('Error fetching metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  // Helper function to process exchange data
  const processExchangeData = (data, exchange) => {
    const symbolData = {};
    
    // Group by symbol and sort by prediction_date
    data.forEach(row => {
      if (!symbolData[row.symbol]) {
        symbolData[row.symbol] = {
          predictions: [],
          symbol: row.symbol,
          exchange: exchange.split('_')[0].toUpperCase()
        };
      }
      symbolData[row.symbol].predictions.push(row);
    });

    // Sort predictions by date for each symbol
    Object.values(symbolData).forEach(item => {
      item.predictions.sort((a, b) => new Date(a.prediction_date) - new Date(b.prediction_date));
    });

    // Calculate metrics for each symbol
    return Object.values(symbolData).map(item => {
      const metrics = calculateMetrics(item.predictions);
      return {
        symbol: item.symbol,
        exchange: item.exchange,
        ...metrics
      };
    });
  };

  // Helper function to calculate metrics
  const calculateMetrics = (predictions) => {
    const metrics = {
      strong_buy: { success: 0, fail: 0 },
      buy: { success: 0, fail: 0 },
      weak_buy: { success: 0, fail: 0 },
      strong_sell: { success: 0, fail: 0 },
      sell: { success: 0, fail: 0 },
      weak_sell: { success: 0, fail: 0 }
    };

    for (let i = 0; i < predictions.length - 1; i++) {
      const current = predictions[i];
      const next = predictions[i + 1];
      const rating = current.rating.toLowerCase();
      const priceIncreased = next.current_price > current.current_price;

      if (rating.includes('strong buy')) {
        priceIncreased ? metrics.strong_buy.success++ : metrics.strong_buy.fail++;
      } else if (rating.includes('weak buy')) {
        priceIncreased ? metrics.weak_buy.success++ : metrics.weak_buy.fail++;
      } else if (rating.includes('buy')) {
        priceIncreased ? metrics.buy.success++ : metrics.buy.fail++;
      } else if (rating.includes('strong sell')) {
        !priceIncreased ? metrics.strong_sell.success++ : metrics.strong_sell.fail++;
      } else if (rating.includes('weak sell')) {
        !priceIncreased ? metrics.weak_sell.success++ : metrics.weak_sell.fail++;
      } else if (rating.includes('sell')) {
        !priceIncreased ? metrics.sell.success++ : metrics.sell.fail++;
      }
    }

    return {
      strong_buy_success: metrics.strong_buy.success,
      strong_buy_fail: metrics.strong_buy.fail,
      buy_success: metrics.buy.success,
      buy_fail: metrics.buy.fail,
      weak_buy_success: metrics.weak_buy.success,
      weak_buy_fail: metrics.weak_buy.fail,
      strong_sell_success: metrics.strong_sell.success,
      strong_sell_fail: metrics.strong_sell.fail,
      sell_success: metrics.sell.success,
      sell_fail: metrics.sell.fail,
      weak_sell_success: metrics.weak_sell.success,
      weak_sell_fail: metrics.weak_sell.fail
    };
  };

  // Helper function to calculate stats
  const calculateStats = (data) => {
    return data.reduce((acc, item) => ({
      totalBuySignals: acc.totalBuySignals + 
        item.strong_buy_success + item.strong_buy_fail +
        item.buy_success + item.buy_fail +
        item.weak_buy_success + item.weak_buy_fail,
      successfulBuySignals: acc.successfulBuySignals + 
        item.strong_buy_success + item.buy_success + item.weak_buy_success,
      totalSellSignals: acc.totalSellSignals + 
        item.strong_sell_success + item.strong_sell_fail +
        item.sell_success + item.sell_fail +
        item.weak_sell_success + item.weak_sell_fail,
      successfulSellSignals: acc.successfulSellSignals + 
        item.strong_sell_success + item.sell_success + item.weak_sell_success
    }), {
      totalBuySignals: 0,
      successfulBuySignals: 0,
      totalSellSignals: 0,
      successfulSellSignals: 0
    });
  };

  // Helper function to calculate percentage
  const calculatePercentage = (success, total) => {
    if (!total) return null; 
    return Math.round((success / total) * 100);
  };

  // Helper function to format badge text
  const formatBadgeText = (success, total) => {
    if (total === 0) return '0%';
    const percentage = Math.round((success / total) * 100);
    return `${percentage}% (${success}/${total})`;
  };

  // Helper function to sort data
  const sortData = (data) => {
    return [...data].sort((a, b) => {
      if (a.exchange !== b.exchange) {
        return a.exchange.localeCompare(b.exchange);
      }
      return a.symbol.localeCompare(b.symbol);
    });
  };

  useEffect(() => {
    fetchData()
  }, [searchTerm, selectedExchange])

  const formatPercentage = (value) => {
    if (!value) return '0%'
    return `${value.toFixed(2)}%`
  }

  const getSuccessRate = (successful, total) => {
    if (!total) return 0
    return (successful / total) * 100
  }

  return (
    <Box minH="100vh" bg={bgColor} w="100%">
      {/* Navbar */}
      <Box
        py={2}
        px={4}
        bg={cardBgColor}
        position="sticky"
        top={0}
        zIndex={2}
        borderBottom="1px"
        borderColor={borderColor}
      >
        <Flex justify="space-between" align="center" maxW="container.xl" mx="auto">
          {/* Left side: Logo and Navigation */}
          <Flex align="center" gap={2}>
            <Flex align="center" gap={1}>
              <Heading size="sm" bgGradient="linear(to-r, blue.400, teal.400)" bgClip="text" fontWeight="bold">
                Swift
              </Heading>
              <Heading size="sm" color={textColor} fontWeight="bold">
                Signal
              </Heading>
            </Flex>
            <Button
              as={RouterLink}
              to="/dashboard"
              size="xs"
              colorScheme="blue"
              leftIcon={<ViewIcon />}
              ml={2}
            >
              Dashboard
            </Button>
          </Flex>

          {/* Right side: Exchange Selector */}
          <Select
            value={selectedExchange}
            onChange={(e) => setSelectedExchange(e.target.value)}
            size="sm"
            w="200px"
            bg={cardBgColor}
          >
            <option value="all">All Exchanges</option>
            <option value="nasdaq_stock_data">NASDAQ</option>
            <option value="nyse_stock_data">NYSE</option>
            <option value="lse_stock_data">LSE</option>
            <option value="fse_stock_data">FSE</option>
          </Select>
        </Flex>
      </Box>

      {/* Main Content */}
      <Container maxW="container.xl" p={4}>
        <VStack spacing={6} align="stretch" w="100%">
          <Heading size="lg">Prediction History</Heading>

          {/* Summary Statistics */}
          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4} w="100%">
            {/* Buy Signals Card */}
            <Card bg={cardBgColor} borderColor={borderColor} borderWidth="1px" w="100%">
              <CardBody>
                <StatGroup>
                  <Stat>
                    <StatLabel color={mutedTextColor}>Buy Signals Success</StatLabel>
                    <StatNumber color={positiveColor}>
                      {formatPercentage(getSuccessRate(aggregateStats.successfulBuySignals, aggregateStats.totalBuySignals))}
                    </StatNumber>
                    <Text fontSize="sm" color={mutedTextColor}>
                      {aggregateStats.successfulBuySignals} of {aggregateStats.totalBuySignals} signals
                    </Text>
                    <Progress 
                      value={getSuccessRate(aggregateStats.successfulBuySignals, aggregateStats.totalBuySignals)}
                      size="sm"
                      colorScheme="green"
                      mt={2}
                    />
                  </Stat>
                </StatGroup>
              </CardBody>
            </Card>

            {/* Sell Signals Card */}
            <Card bg={cardBgColor} borderColor={borderColor} borderWidth="1px" w="100%">
              <CardBody>
                <StatGroup>
                  <Stat>
                    <StatLabel color={mutedTextColor}>Sell Signals Success</StatLabel>
                    <StatNumber color={positiveColor}>
                      {formatPercentage(getSuccessRate(aggregateStats.successfulSellSignals, aggregateStats.totalSellSignals))}
                    </StatNumber>
                    <Text fontSize="sm" color={mutedTextColor}>
                      {aggregateStats.successfulSellSignals} of {aggregateStats.totalSellSignals} signals
                    </Text>
                    <Progress 
                      value={getSuccessRate(aggregateStats.successfulSellSignals, aggregateStats.totalSellSignals)}
                      size="sm"
                      colorScheme="red"
                      mt={2}
                    />
                  </Stat>
                </StatGroup>
              </CardBody>
            </Card>
          </SimpleGrid>

          {/* Search and Table Container */}
          <VStack spacing={4} w="100%">
            <InputGroup maxW="300px" alignSelf="flex-start">
              <InputLeftElement pointerEvents="none">
                <SearchIcon color="gray.300" />
              </InputLeftElement>
              <Input
                placeholder="Search by symbol..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                bg={cardBgColor}
              />
            </InputGroup>

            {/* Results Table */}
            <Box overflowX="auto" borderWidth="1px" borderColor={borderColor} borderRadius="lg" boxShadow="sm" w="100%">
              <Table size="sm" variant="simple">
                <Thead>
                  <Tr bg={useColorModeValue('gray.50', 'gray.800')}>
                    <Th position="sticky" top={0} bg={useColorModeValue('gray.50', 'gray.800')} zIndex={1} width="120px">Symbol</Th>
                    <Th position="sticky" top={0} bg={useColorModeValue('gray.50', 'gray.800')} zIndex={1} width="100px">Exchange</Th>
                    <Th position="sticky" top={0} bg={useColorModeValue('gray.50', 'gray.800')} zIndex={1} colSpan={3} textAlign="center" borderLeft="1px" borderLeftColor={borderColor}>Buy Signals</Th>
                    <Th position="sticky" top={0} bg={useColorModeValue('gray.50', 'gray.800')} zIndex={1} colSpan={3} textAlign="center" borderLeft="1px" borderLeftColor={borderColor}>Sell Signals</Th>
                  </Tr>
                  <Tr bg={useColorModeValue('gray.50', 'gray.800')}>
                    <Th position="sticky" top="40px" bg={useColorModeValue('gray.50', 'gray.800')} zIndex={1}></Th>
                    <Th position="sticky" top="40px" bg={useColorModeValue('gray.50', 'gray.800')} zIndex={1}></Th>
                    <Th position="sticky" top="40px" bg={useColorModeValue('gray.50', 'gray.800')} zIndex={1} borderLeft="1px" borderLeftColor={borderColor}>Strong</Th>
                    <Th position="sticky" top="40px" bg={useColorModeValue('gray.50', 'gray.800')} zIndex={1}>Normal</Th>
                    <Th position="sticky" top="40px" bg={useColorModeValue('gray.50', 'gray.800')} zIndex={1}>Weak</Th>
                    <Th position="sticky" top="40px" bg={useColorModeValue('gray.50', 'gray.800')} zIndex={1} borderLeft="1px" borderLeftColor={borderColor}>Strong</Th>
                    <Th position="sticky" top="40px" bg={useColorModeValue('gray.50', 'gray.800')} zIndex={1}>Normal</Th>
                    <Th position="sticky" top="40px" bg={useColorModeValue('gray.50', 'gray.800')} zIndex={1}>Weak</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {data.map((item, index) => {
                    const strongBuyTotal = item.strong_buy_success + item.strong_buy_fail;
                    const buyTotal = item.buy_success + item.buy_fail;
                    const weakBuyTotal = item.weak_buy_success + item.weak_buy_fail;
                    const strongSellTotal = item.strong_sell_success + item.strong_sell_fail;
                    const sellTotal = item.sell_success + item.sell_fail;
                    const weakSellTotal = item.weak_sell_success + item.weak_sell_fail;

                    // Check if this is a new exchange group
                    const isNewExchange = index === 0 || item.exchange !== data[index - 1].exchange;
                    
                    return (
                      <Tr key={`${item.symbol}-${item.exchange}`}
                          _hover={{ bg: useColorModeValue('gray.50', 'gray.900') }}
                          borderTopWidth={isNewExchange ? "2px" : "1px"}
                          borderTopColor={isNewExchange ? borderColor : "inherit"}>
                        <Td py={1.5} fontWeight="medium">{item.symbol}</Td>
                        <Td py={1.5} color={mutedTextColor}>{item.exchange}</Td>
                        <Td py={1.5} borderLeft="1px" borderLeftColor={borderColor}>
                          <Badge size="sm" variant="subtle" colorScheme={strongBuyTotal > 0 ? (item.strong_buy_success >= strongBuyTotal/2 ? 'green' : 'red') : 'gray'}>
                            {formatBadgeText(item.strong_buy_success, strongBuyTotal)}
                          </Badge>
                        </Td>
                        <Td py={1.5}>
                          <Badge size="sm" variant="subtle" colorScheme={buyTotal > 0 ? (item.buy_success >= buyTotal/2 ? 'green' : 'red') : 'gray'}>
                            {formatBadgeText(item.buy_success, buyTotal)}
                          </Badge>
                        </Td>
                        <Td py={1.5}>
                          <Badge size="sm" variant="subtle" colorScheme={weakBuyTotal > 0 ? (item.weak_buy_success >= weakBuyTotal/2 ? 'green' : 'red') : 'gray'}>
                            {formatBadgeText(item.weak_buy_success, weakBuyTotal)}
                          </Badge>
                        </Td>
                        <Td py={1.5} borderLeft="1px" borderLeftColor={borderColor}>
                          <Badge size="sm" variant="subtle" colorScheme={strongSellTotal > 0 ? (item.strong_sell_success >= strongSellTotal/2 ? 'green' : 'red') : 'gray'}>
                            {formatBadgeText(item.strong_sell_success, strongSellTotal)}
                          </Badge>
                        </Td>
                        <Td py={1.5}>
                          <Badge size="sm" variant="subtle" colorScheme={sellTotal > 0 ? (item.sell_success >= sellTotal/2 ? 'green' : 'red') : 'gray'}>
                            {formatBadgeText(item.sell_success, sellTotal)}
                          </Badge>
                        </Td>
                        <Td py={1.5}>
                          <Badge size="sm" variant="subtle" colorScheme={weakSellTotal > 0 ? (item.weak_sell_success >= weakSellTotal/2 ? 'green' : 'red') : 'gray'}>
                            {formatBadgeText(item.weak_sell_success, weakSellTotal)}
                          </Badge>
                        </Td>
                      </Tr>
                    );
                  })}
                </Tbody>
              </Table>
            </Box>
          </VStack>
        </VStack>
      </Container>
    </Box>
  )
}

export default History
