import { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'
import {
  Box,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Select,
  Input,
  VStack,
  HStack,
  Text,
  Container,
  Heading,
  Badge,
  Spinner,
  TableContainer,
  Stat,
  StatLabel,
  StatNumber,
  Grid,
  Card,
  CardBody,
  useColorMode,
  IconButton,
  Tooltip,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Button,
  Flex,
  Spacer,
  useColorModeValue,
  Divider,
  SimpleGrid,
  InputGroup,
  InputLeftElement,
  FormControl,
  FormLabel,
  GridItem
} from '@chakra-ui/react'
import { 
  SunIcon, 
  MoonIcon, 
  SettingsIcon, 
  SearchIcon, 
  DownloadIcon, 
  RepeatIcon, 
  ViewIcon,
  TriangleDownIcon
} from '@chakra-ui/icons'
import { useMemo } from 'react'

function App() {
  const { colorMode, toggleColorMode } = useColorMode()
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [symbolFilter, setSymbolFilter] = useState('')
  const [companyFilter, setCompanyFilter] = useState('')
  const [selectedRating, setSelectedRating] = useState('all')
  const [selectedSector, setSelectedSector] = useState('all')
  const [selectedIndustry, setSelectedIndustry] = useState('all')
  const [selectedExchange, setSelectedExchange] = useState('nasdaq_stock_data')
  const [ratingStats, setRatingStats] = useState({})
  const [sectors, setSectors] = useState([])
  const [industries, setIndustries] = useState([])
  const [ratings, setRatings] = useState([])
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' })

  // Color theme values
  const bgColor = useColorModeValue('gray.50', '#000000')
  const cardBgColor = useColorModeValue('white', '#121212')
  const textColor = useColorModeValue('gray.800', '#ffffff')
  const mutedTextColor = useColorModeValue('gray.600', '#888888')
  const borderColor = useColorModeValue('gray.200', '#202020')
  const hoverBgColor = useColorModeValue('gray.50', '#1c1c1c')
  const positiveColor = useColorModeValue('green.500', '#00873c')
  const negativeColor = useColorModeValue('red.500', '#ff4d4d')

  // Rating colors with improved color scheme
  const getRatingColor = (rating) => {
    const ratingColors = {
      'Strong Buy': 'green',
      'Buy': 'teal',
      'Weak Buy': 'blue',
      'Hold': 'yellow',
      'Weak Sell': 'orange',
      'Sell': 'red',
      'Strong Sell': 'purple'
    }
    return ratingColors[rating] || 'gray'
  }

  // Sector colors with simplified palette
  const getSectorColor = (sector) => {
    const sectorColors = {
      'Technology': 'blue',
      'Healthcare': 'teal',
      'Financial Services': 'purple',
      'Consumer Cyclical': 'orange',
      'Consumer Defensive': 'green',
      'Industrials': 'gray',
      'Basic Materials': 'yellow',
      'Energy': 'red',
      'Communication Services': 'pink',
      'Real Estate': 'cyan',
      'Utilities': 'blue'
    }
    return sectorColors[sector] || 'gray'
  }

  // Industry colors with direct mapping
  const getIndustryColor = (industry) => {
    const industryColors = {
      // Technology
      'Software': 'blue',
      'Hardware': 'cyan',
      'Semiconductors': 'blue',
      'Communication Equipment': 'cyan',
      // Healthcare
      'Biotechnology': 'teal',
      'Medical Devices': 'green',
      'Pharmaceuticals': 'teal',
      'Drug Manufacturers': 'green',
      // Financial
      'Banks': 'purple',
      'Insurance': 'purple',
      'Capital Markets': 'purple',
      // Consumer
      'Retail': 'orange',
      'Entertainment': 'pink',
      'Auto': 'orange',
      'Travel Services': 'orange',
      // Industrial & Energy
      'Airlines': 'gray',
      'Mining': 'yellow',
      'Oil & Gas': 'red',
      'Equipment': 'gray'
    }
    return industryColors[industry] || getSectorColor(industry.split(' ')[0]) || 'gray'
  }

  const formatDate = (dateString) => {
    if (!dateString) return '-'
    return dateString.split('T')[0]
  }

  const formatPrice = (price) => {
    if (!price && price !== 0) return '-'
    return `$${price.toFixed(2)}`
  }

  const formatChange = (dailyReturns) => {
    if (!dailyReturns && dailyReturns !== 0) return '-'
    return `${(dailyReturns * 100).toFixed(1)}%`
  }

  const getValueColor = (value, threshold = 0) => {
    if (!value) return textColor
    return value >= threshold ? positiveColor : negativeColor
  }

  const formatVolume = (volume) => {
    if (!volume) return '-'
    if (volume >= 1e6) return `${(volume / 1e6).toFixed(1)}M`
    if (volume >= 1e3) return `${(volume / 1e3).toFixed(1)}K`
    return volume.toString()
  }

  const formatValue = (value, decimals = 1, showPercent = false) => {
    if (!value && value !== 0) return '-'
    return `${value.toFixed(decimals)}${showPercent ? '%' : ''}`
  }

  const getPriceColor = (dailyReturns) => {
    if (!dailyReturns && dailyReturns !== 0) return textColor
    return dailyReturns >= 0 ? positiveColor : negativeColor
  }

  useEffect(() => {
    fetchData()
  }, [selectedExchange])

  const fetchData = async () => {
    setLoading(true)
    try {
      // Get today's date in UTC
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      today.setDate(today.getDate() - 1) // Include yesterday's data

      let { count, error: countError } = await supabase
        .from(selectedExchange)
        .select('*', { count: 'exact', head: true })
        .gte('prediction_date', today.toISOString())

      if (countError) throw countError
      console.log('Count:', count) // Debug log

      // Fetch all records in batches of 1000
      let allData = []
      let page = 0
      const pageSize = 1000
      
      while (page * pageSize < count) {
        const { data: pageData, error } = await supabase
          .from(selectedExchange)
          .select('*')
          .gte('prediction_date', today.toISOString())
          .range(page * pageSize, (page + 1) * pageSize - 1)
          .order('symbol', { ascending: true })

        if (error) {
          console.error('Error fetching data:', error) // Debug log
          throw error
        }
        
        if (pageData) {
          console.log('Page data length:', pageData.length) // Debug log
          allData = [...allData, ...pageData]
        }
        
        page++
      }

      console.log('Total data length:', allData.length) // Debug log

      setData(allData)
      calculateRatingStats(allData)
      
      // Extract unique sectors and industries
      const uniqueSectors = [...new Set(allData.map(item => item.sector).filter(Boolean))]
      const uniqueIndustries = [...new Set(allData.map(item => item.industry).filter(Boolean))]
      const uniqueRatings = [...new Set(allData.map(item => item.rating).filter(Boolean))]
      setSectors(uniqueSectors.sort())
      setIndustries(uniqueIndustries.sort())
      setRatings(uniqueRatings.sort())

      if (allData.length < count) {
        // toast({
        //   title: 'Warning',
        //   description: `Only loaded ${allData.length} out of ${count} records. Try refreshing if you need to see more data.`,
        //   status: 'warning',
        //   duration: 5000,
        //   isClosable: true,
        // })
      }
    } catch (error) {
      // toast({
      //   title: 'Error fetching data',
      //   description: error.message,
      //   status: 'error',
      //   duration: 5000,
      //   isClosable: true,
      // })
    } finally {
      setLoading(false)
    }
  }

  const calculateRatingStats = (stockData) => {
    const stats = stockData.reduce((acc, stock) => {
      const rating = stock.rating || 'Unrated'
      if (!acc[rating]) {
        acc[rating] = {
          count: 0,
          totalReturn: 0,
          avgReturn: 0,
          minReturn: Infinity,
          maxReturn: -Infinity
        }
      }
      acc[rating].count++
      if (stock.expected_return) {
        acc[rating].totalReturn += stock.expected_return
        acc[rating].minReturn = Math.min(acc[rating].minReturn, stock.expected_return)
        acc[rating].maxReturn = Math.max(acc[rating].maxReturn, stock.expected_return)
      }
      return acc
    }, {})

    Object.keys(stats).forEach(rating => {
      stats[rating].avgReturn = stats[rating].totalReturn / stats[rating].count
    })

    setRatingStats(stats)
  }

  // Sorting function
  const getSortedData = (items, sortKey, direction) => {
    if (!sortKey) return items;

    return [...items].sort((a, b) => {
      let aValue = a[sortKey];
      let bValue = b[sortKey];

      // Handle numeric values
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return direction === 'asc' ? aValue - bValue : bValue - aValue;
      }

      // Handle string values
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
        return direction === 'asc' 
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }

      // Handle undefined or null values
      if (!aValue) return direction === 'asc' ? 1 : -1;
      if (!bValue) return direction === 'asc' ? -1 : 1;

      return 0;
    });
  };

  // Filter and sort data
  const filteredAndSortedData = useMemo(() => {
    // First apply filters
    const filtered = data.filter(stock => {
      const matchesSymbol = !symbolFilter || stock.symbol?.toLowerCase().startsWith(symbolFilter.toLowerCase())
      const matchesCompany = !companyFilter || stock.company_name?.toLowerCase().includes(companyFilter.toLowerCase())
      const matchesSearch = !searchTerm || 
                         stock.sector?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         stock.industry?.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesRating = selectedRating === 'all' || stock.rating === selectedRating
      const matchesSector = selectedSector === 'all' || stock.sector === selectedSector
      const matchesIndustry = selectedIndustry === 'all' || stock.industry === selectedIndustry

      return matchesSymbol && matchesCompany && matchesSearch && 
             matchesRating && matchesSector && matchesIndustry;
    });

    // Then apply sorting
    return getSortedData(filtered, sortConfig.key, sortConfig.direction);
  }, [data, symbolFilter, companyFilter, searchTerm, selectedRating, 
      selectedSector, selectedIndustry, sortConfig]);

  // Sort handler
  const requestSort = (key) => {
    setSortConfig(prevConfig => ({
      key,
      direction: 
        prevConfig.key === key && prevConfig.direction === 'asc' 
          ? 'desc' 
          : 'asc',
    }));
  };

  // Sort indicator component
  const SortIndicator = ({ columnKey }) => {
    const isActive = sortConfig.key === columnKey;
    const rotation = sortConfig.direction === 'desc' && isActive ? 180 : 0;
    
    return (
      <TriangleDownIcon
        ml={1}
        boxSize={3}
        opacity={isActive ? 1 : 0.3}
        transform={`rotate(${rotation}deg)`}
        transition="transform 0.2s ease"
      />
    );
  };

  return (
    <Box minH="100vh" bg={bgColor}>
      <Container maxW="100%" p={1}>
        <VStack spacing={1} align="stretch">
          {/* Compact Header with Stats */}
          <Flex 
            bg={cardBgColor} 
            p={2} 
            rounded="lg" 
            shadow="sm" 
            direction={{ base: 'column', md: 'row' }}
            gap={2}
            borderColor={borderColor}
            borderWidth="1px"
          >
            {/* Left side: Title and Exchange */}
            <Flex align="center" gap={2} minW={{ md: '300px' }}>
              <Flex align="center" gap={1}>
                <Heading 
                  size="md" 
                  bgGradient="linear(to-r, blue.400, teal.400)" 
                  bgClip="text" 
                  fontWeight="bold"
                  letterSpacing="tight"
                >
                  Swift
                </Heading>
                <Heading 
                  size="md" 
                  color={textColor}
                  fontWeight="bold"
                  letterSpacing="tight"
                >
                  Signal
                </Heading>
              </Flex>
              <Text fontSize="sm" color={mutedTextColor}>
                {data.length > 0 ? formatDate(data[0].prediction_date) : ''}
              </Text>
              <Select
                value={selectedExchange}
                onChange={(e) => setSelectedExchange(e.target.value)}
                size="xs"
                w="100px"
              >
                <option value="nasdaq_stock_data">NASDAQ</option>
                <option value="nyse_stock_data">NYSE</option>
                <option value="lse_stock_data">LSE</option>
                <option value="fse_stock_data">FSE</option>
              </Select>
            </Flex>

            {/* Middle: Stats */}
            <Flex flex={1} gap={2} overflowX="auto" css={{
              '&::-webkit-scrollbar': { height: '6px' },
              '&::-webkit-scrollbar-track': { background: 'transparent' },
              '&::-webkit-scrollbar-thumb': { background: useColorModeValue('gray.300', 'gray.600'), borderRadius: '3px' }
            }}>
              {Object.entries(ratingStats).map(([rating, stats]) => (
                <Box 
                  key={rating} 
                  bg={useColorModeValue('white', '#121212')} 
                  p={1.5} 
                  rounded="md" 
                  shadow="sm"
                  minW="100px"
                  borderColor={borderColor}
                  borderWidth="1px"
                >
                  <HStack spacing={1}>
                    <Badge size="sm" colorScheme={getRatingColor(rating).split('.')[0]}>
                      {rating}
                    </Badge>
                    <Text fontSize="xs" color={textColor} fontWeight="bold">
                      {stats.count}
                    </Text>
                    <Text fontSize="xs" color={mutedTextColor}>
                      {stats.avgReturn.toFixed(1)}%
                    </Text>
                  </HStack>
                </Box>
              ))}
            </Flex>

            {/* Right side: Actions */}
            <HStack spacing={1}>
              <IconButton
                icon={colorMode === 'light' ? <MoonIcon /> : <SunIcon />}
                onClick={toggleColorMode}
                variant="ghost"
                size="xs"
                aria-label="Toggle color mode"
              />
              <Menu>
                <MenuButton
                  as={IconButton}
                  icon={<SettingsIcon />}
                  variant="ghost"
                  size="xs"
                />
                <MenuList>
                  <MenuItem icon={<DownloadIcon />}>Download Data</MenuItem>
                  <MenuItem icon={<RepeatIcon />}>Refresh Data</MenuItem>
                  <MenuItem icon={<ViewIcon />}>Column Settings</MenuItem>
                </MenuList>
              </Menu>
            </HStack>
          </Flex>

          {/* Improved Filter Layout */}
          <Grid
            templateColumns={{ 
              base: "repeat(2, 1fr)", 
              md: "repeat(3, 1fr)", 
              lg: "repeat(6, 1fr)" 
            }}
            gap={1}
            p={2}
            bg={cardBgColor}
            rounded="lg"
            shadow="sm"
            borderColor={borderColor}
            borderWidth="1px"
          >
            {/* Symbol Filter */}
            <GridItem>
              <FormControl>
                <FormLabel fontSize="xs" color={mutedTextColor} mb={0}>Symbol</FormLabel>
                <InputGroup size="sm">
                  <Input
                    placeholder="AAPL..."
                    value={symbolFilter}
                    onChange={(e) => setSymbolFilter(e.target.value)}
                    bg={cardBgColor}
                    borderColor={borderColor}
                  />
                </InputGroup>
              </FormControl>
            </GridItem>

            {/* Company Filter */}
            <GridItem>
              <FormControl>
                <FormLabel fontSize="xs" color={mutedTextColor} mb={0}>Company</FormLabel>
                <InputGroup size="sm">
                  <Input
                    placeholder="Apple Inc..."
                    value={companyFilter}
                    onChange={(e) => setCompanyFilter(e.target.value)}
                    bg={cardBgColor}
                    borderColor={borderColor}
                  />
                </InputGroup>
              </FormControl>
            </GridItem>

            {/* Sector/Industry Search */}
            <GridItem>
              <FormControl>
                <FormLabel fontSize="xs" color={mutedTextColor} mb={0}>Sector/Industry</FormLabel>
                <InputGroup size="sm">
                  <Input
                    placeholder="Technology..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    bg={cardBgColor}
                    borderColor={borderColor}
                  />
                </InputGroup>
              </FormControl>
            </GridItem>

            {/* Rating Filter */}
            <GridItem>
              <FormControl>
                <FormLabel fontSize="xs" color={mutedTextColor} mb={0}>Rating</FormLabel>
                <Select
                  size="sm"
                  value={selectedRating}
                  onChange={(e) => setSelectedRating(e.target.value)}
                  bg={cardBgColor}
                  borderColor={borderColor}
                >
                  <option value="all">All Ratings</option>
                  {ratings.map((rating) => (
                    <option key={rating} value={rating}>{rating}</option>
                  ))}
                </Select>
              </FormControl>
            </GridItem>

            {/* Sector Filter */}
            <GridItem>
              <FormControl>
                <FormLabel fontSize="xs" color={mutedTextColor} mb={0}>Sector</FormLabel>
                <Select
                  size="sm"
                  value={selectedSector}
                  onChange={(e) => setSelectedSector(e.target.value)}
                  bg={cardBgColor}
                  borderColor={borderColor}
                >
                  <option value="all">All Sectors</option>
                  {sectors.map((sector) => (
                    <option key={sector} value={sector}>{sector}</option>
                  ))}
                </Select>
              </FormControl>
            </GridItem>

            {/* Industry Filter */}
            <GridItem>
              <FormControl>
                <FormLabel fontSize="xs" color={mutedTextColor} mb={0}>Industry</FormLabel>
                <Select
                  size="sm"
                  value={selectedIndustry}
                  onChange={(e) => setSelectedIndustry(e.target.value)}
                  bg={cardBgColor}
                  borderColor={borderColor}
                >
                  <option value="all">All Industries</option>
                  {industries.map((industry) => (
                    <option key={industry} value={industry}>{industry}</option>
                  ))}
                </Select>
              </FormControl>
            </GridItem>
          </Grid>

          {/* Table */}
          {loading ? (
            <Flex 
              p={4} 
              justify="center" 
              align="center" 
              bg={cardBgColor} 
              rounded="lg" 
              shadow="sm"
              borderColor={borderColor}
              borderWidth="1px"
            >
              <Spinner color={useColorModeValue('blue.500', 'blue.200')} />
            </Flex>
          ) : (
            <Box 
              bg={cardBgColor} 
              rounded="lg" 
              shadow="sm" 
              overflowX="auto"
              borderColor={borderColor}
              borderWidth="1px"
            >
              <TableContainer maxH="calc(100vh - 120px)" overflowY="auto">
                <Table variant="simple" size="sm">
                  <Thead 
                    position="sticky" 
                    top={0} 
                    zIndex={1} 
                    bg={cardBgColor}
                  >
                    <Tr>
                      <Th 
                        py={2} 
                        px={2} 
                        w="80px" 
                        color={mutedTextColor}
                        cursor="pointer"
                        onClick={() => requestSort('symbol')}
                        _hover={{ color: textColor }}
                      >
                        Symbol
                        <SortIndicator columnKey="symbol" />
                      </Th>
                      <Th 
                        py={2} 
                        px={2} 
                        w="150px" 
                        color={mutedTextColor}
                        cursor="pointer"
                        onClick={() => requestSort('company_name')}
                        _hover={{ color: textColor }}
                      >
                        Company
                        <SortIndicator columnKey="company_name" />
                      </Th>
                      <Th 
                        py={2} 
                        px={1} 
                        w="110px" 
                        color={mutedTextColor}
                        cursor="pointer"
                        onClick={() => requestSort('sector')}
                        _hover={{ color: textColor }}
                      >
                        Sector
                        <SortIndicator columnKey="sector" />
                      </Th>
                      <Th 
                        py={2} 
                        px={1} 
                        w="130px" 
                        color={mutedTextColor}
                        cursor="pointer"
                        onClick={() => requestSort('industry')}
                        _hover={{ color: textColor }}
                      >
                        Industry
                        <SortIndicator columnKey="industry" />
                      </Th>
                      <Th 
                        py={2} 
                        px={2} 
                        isNumeric 
                        w="120px" 
                        color={mutedTextColor}
                        cursor="pointer"
                        onClick={() => requestSort('current_price')}
                        _hover={{ color: textColor }}
                      >
                        Previous Close Price
                        <SortIndicator columnKey="current_price" />
                      </Th>
                      <Th 
                        py={2} 
                        px={2} 
                        w="90px" 
                        color={mutedTextColor}
                        cursor="pointer"
                        onClick={() => requestSort('rating')}
                        _hover={{ color: textColor }}
                      >
                        Rating
                        <SortIndicator columnKey="rating" />
                      </Th>
                      <Th 
                        py={2} 
                        px={2} 
                        isNumeric 
                        w="80px" 
                        color={mutedTextColor}
                        cursor="pointer"
                        onClick={() => requestSort('buy_score')}
                        _hover={{ color: textColor }}
                      >
                        Buy Score
                        <SortIndicator columnKey="buy_score" />
                      </Th>
                      <Th 
                        py={2} 
                        px={2} 
                        isNumeric 
                        w="80px" 
                        color={mutedTextColor}
                        cursor="pointer"
                        onClick={() => requestSort('rsi')}
                        _hover={{ color: textColor }}
                      >
                        RSI
                        <SortIndicator columnKey="rsi" />
                      </Th>
                      <Th 
                        py={2} 
                        px={2} 
                        isNumeric 
                        w="80px" 
                        color={mutedTextColor}
                        cursor="pointer"
                        onClick={() => requestSort('macd')}
                        _hover={{ color: textColor }}
                      >
                        MACD
                        <SortIndicator columnKey="macd" />
                      </Th>
                      <Th 
                        py={2} 
                        px={2} 
                        isNumeric 
                        w="80px" 
                        color={mutedTextColor}
                        cursor="pointer"
                        onClick={() => requestSort('volume')}
                        _hover={{ color: textColor }}
                      >
                        Vol
                        <SortIndicator columnKey="volume" />
                      </Th>
                      <Th 
                        py={2} 
                        px={2} 
                        isNumeric 
                        w="80px" 
                        color={mutedTextColor}
                        cursor="pointer"
                        onClick={() => requestSort('market_cap')}
                        _hover={{ color: textColor }}
                      >
                        MCap
                        <SortIndicator columnKey="market_cap" />
                      </Th>
                      <Th 
                        py={2} 
                        px={2} 
                        isNumeric 
                        w="80px" 
                        color={mutedTextColor}
                        cursor="pointer"
                        onClick={() => requestSort('pe_ratio')}
                        _hover={{ color: textColor }}
                      >
                        P/E
                        <SortIndicator columnKey="pe_ratio" />
                      </Th>
                      <Th 
                        py={2} 
                        px={2} 
                        isNumeric 
                        w="80px" 
                        color={mutedTextColor}
                        cursor="pointer"
                        onClick={() => requestSort('return_on_equity')}
                        _hover={{ color: textColor }}
                      >
                        ROE%
                        <SortIndicator columnKey="return_on_equity" />
                      </Th>
                      <Th 
                        py={2} 
                        px={2} 
                        isNumeric 
                        w="80px" 
                        color={mutedTextColor}
                        cursor="pointer"
                        onClick={() => requestSort('revenue_growth')}
                        _hover={{ color: textColor }}
                      >
                        RevG%
                        <SortIndicator columnKey="revenue_growth" />
                      </Th>
                      <Th 
                        py={2} 
                        px={2} 
                        isNumeric 
                        w="80px" 
                        color={mutedTextColor}
                        cursor="pointer"
                        onClick={() => requestSort('earnings_growth')}
                        _hover={{ color: textColor }}
                      >
                        EPS G%
                        <SortIndicator columnKey="earnings_growth" />
                      </Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {filteredAndSortedData.map((stock) => (
                      <Tr 
                        key={stock.symbol} 
                        _hover={{ bg: hoverBgColor }}
                        borderColor={borderColor}
                      >
                        <Td py={0.5} px={2} fontSize="xs" fontWeight="medium">{stock.symbol}</Td>
                        <Td py={0.5} px={2} fontSize="xs" maxW="150px" isTruncated>{stock.company_name}</Td>
                        <Td py={0.5} px={1} fontSize="xs" w="110px">
                          <Box overflow="hidden">
                            <Badge 
                              colorScheme={getSectorColor(stock.sector)} 
                              variant="subtle"
                              size="sm"
                              px={1}
                              py={0}
                              borderRadius="sm"
                              textTransform="none"
                              isTruncated
                              display="block"
                              w="100%"
                            >
                              {stock.sector}
                            </Badge>
                          </Box>
                        </Td>
                        <Td py={0.5} px={1} fontSize="xs" w="130px">
                          <Box overflow="hidden">
                            <Badge 
                              colorScheme={getIndustryColor(stock.industry)} 
                              variant="subtle"
                              size="sm"
                              px={1}
                              py={0}
                              borderRadius="sm"
                              textTransform="none"
                              isTruncated
                              display="block"
                              w="100%"
                            >
                              {stock.industry}
                            </Badge>
                          </Box>
                        </Td>
                        <Td py={0.5} px={2} isNumeric fontSize="xs" fontWeight="medium" color={getPriceColor(stock.daily_returns)}>
                          {formatPrice(stock.current_price)}
                        </Td>
                        <Td py={0.5} px={2}>
                          <Badge 
                            fontSize="10px" 
                            colorScheme={getRatingColor(stock.rating)}
                            px={2}
                            py={0.5}
                            borderRadius="md"
                          >
                            {stock.rating}
                          </Badge>
                        </Td>
                        <Td py={0.5} px={2} isNumeric fontSize="xs" color={getValueColor(stock.probability, 50)}>
                          {formatValue(stock.probability, 1, true)}
                        </Td>
                        <Td py={0.5} px={2} isNumeric fontSize="xs" color={getValueColor(stock.rsi, 50)}>
                          {formatValue(stock.rsi)}
                        </Td>
                        <Td py={0.5} px={2} isNumeric fontSize="xs" color={getValueColor(stock.macd)}>
                          {formatValue(stock.macd)}
                        </Td>
                        <Td py={0.5} px={2} isNumeric fontSize="xs">
                          {formatVolume(stock.volume)}
                        </Td>
                        <Td py={0.5} px={2} isNumeric fontSize="xs">
                          {stock.market_cap >= 1e9 
                            ? `${(stock.market_cap / 1e9).toFixed(1)}B` 
                            : `${(stock.market_cap / 1e6).toFixed(0)}M`}
                        </Td>
                        <Td py={0.5} px={2} isNumeric fontSize="xs" color={getValueColor(stock.pe_ratio, 15)}>
                          {formatValue(stock.pe_ratio)}
                        </Td>
                        <Td py={0.5} px={2} isNumeric fontSize="xs" color={getValueColor(stock.return_on_equity)}>
                          {formatValue(stock.return_on_equity * 100, 1, true)}
                        </Td>
                        <Td py={0.5} px={2} isNumeric fontSize="xs" color={getValueColor(stock.revenue_growth)}>
                          {formatValue(stock.revenue_growth * 100, 1, true)}
                        </Td>
                        <Td py={0.5} px={2} isNumeric fontSize="xs" color={getValueColor(stock.earnings_growth)}>
                          {formatValue(stock.earnings_growth * 100, 1, true)}
                        </Td>
                      </Tr>
                    ))}
                  </Tbody>
                </Table>
              </TableContainer>
            </Box>
          )}
          
          {/* Status Bar */}
          <Flex justify="center" align="center" py={0.5} fontSize="xs" color={mutedTextColor}>
            <Text>Showing {filteredAndSortedData.length} of {data.length} stocks</Text>
            {filteredAndSortedData.length < data.length && (
              <Badge ml={1} colorScheme="blue" variant="subtle" fontSize="2xs">
                Filtered
              </Badge>
            )}
          </Flex>
        </VStack>
      </Container>
    </Box>
  )
}

export default App
