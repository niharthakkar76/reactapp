import { useState, useEffect, useRef } from 'react'
import { supabase } from './supabaseClient'
import { Link } from 'react-router-dom'
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
  GridItem,
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
  const [page, setPage] = useState(0)
  const [hasMore, setHasMore] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const tableContainerRef = useRef(null)
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
      'Weak Sell': 'orange',
      'Sell': 'red',
      'Strong Sell': 'red'
    }
    return ratingColors[rating] || 'gray'
  }

  // Get color scheme for sectors
  const getSectorColor = (sector) => {
    const sectorColors = {
      'Technology': 'blue',
      'Healthcare': 'green',
      'Financial': 'purple',
      'Consumer': 'orange',
      'Industrial': 'gray',
      'Energy': 'yellow',
      'Materials': 'red',
      'Communication': 'pink',
      'Real Estate': 'cyan',
      'Utilities': 'teal'
    }
    return sectorColors[sector] || 'gray'
  }

  // Industry colors with focused palette
  const getIndustryColor = (industry) => {
    const industryColors = {
      // Tech & Comm
      'Software': 'blue',
      'Hardware': 'cyan',
      'Semiconductors': 'blue',
      'Communication': 'pink',
      // Healthcare
      'Biotech': 'teal',
      'Medical': 'green',
      'Pharma': 'teal',
      // Financial
      'Banks': 'purple',
      'Insurance': 'purple',
      'Markets': 'purple',
      // Consumer
      'Retail': 'orange',
      'Media': 'pink',
      'Auto': 'orange',
      'Travel': 'orange',
      // Industrial
      'Transport': 'gray',
      'Mining': 'yellow',
      'Oil': 'red',
      'Equipment': 'gray'
    }
    // Try exact match first, then first word match, then sector color
    return industryColors[industry] || 
           industryColors[industry.split(' ')[0]] || 
           getSectorColor(industry.split(' ')[0]) || 
           'gray'
  }

  const formatDate = (dateString) => {
    if (!dateString) return '-'
    return dateString.split('T')[0]
  }

  const formatPrice = (price) => {
    if (price === null || price === undefined || isNaN(price)) return '-'
    return `$${Number(price).toFixed(2)}`
  }

  const formatChange = (dailyReturns) => {
    if (dailyReturns === null || dailyReturns === undefined || isNaN(dailyReturns)) return '-'
    return `${(Number(dailyReturns) * 100).toFixed(1)}%`
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
    if (value === null || value === undefined || isNaN(value)) return '-'
    return `${Number(value).toFixed(decimals)}${showPercent ? '%' : ''}`
  }

  const getPriceColor = (dailyReturns) => {
    if (dailyReturns === null || dailyReturns === undefined || isNaN(dailyReturns)) return textColor
    return Number(dailyReturns) >= 0 ? positiveColor : negativeColor
  }

  const fetchAllData = async () => {
    const today = new Date()
    let allData = []
    let hasMore = true
    let page = 0
    const pageSize = 1000

    while (hasMore) {
      const { data, error, count } = await supabase
        .from(selectedExchange)
        .select('*', { count: 'exact' })
        .gte('prediction_date', today.toISOString().split('T')[0])
        .range(page * pageSize, (page + 1) * pageSize - 1)

      if (error) {
        console.error('Error fetching all data:', error)
        break
      }

      if (data && data.length > 0) {
        allData = [...allData, ...data]
        hasMore = allData.length < count
        page++
      } else {
        hasMore = false
      }
    }

    return allData
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
          maxReturn: -Infinity,
          examples: []
        }
      }
      
      const stat = acc[rating]
      stat.count++
      
      if (stock.expected_return !== null && stock.expected_return !== undefined) {
        stat.totalReturn += stock.expected_return
        stat.minReturn = Math.min(stat.minReturn, stock.expected_return)
        stat.maxReturn = Math.max(stat.maxReturn, stock.expected_return)
      }
      
      if (stat.examples.length < 3) {
        stat.examples.push({
          symbol: stock.symbol,
          price: stock.current_price,
          expected_return: stock.expected_return,
          probability: stock.probability
        })
      }
      
      return acc
    }, {})

    // Calculate averages and format stats
    Object.values(stats).forEach(stat => {
      if (stat.count > 0) {
        stat.avgReturn = stat.totalReturn / stat.count
      }
      if (stat.minReturn === Infinity) stat.minReturn = 0
      if (stat.maxReturn === -Infinity) stat.maxReturn = 0
    })

    setRatingStats(stats)
  }

  const fetchData = async (resetData = true) => {
    if (resetData) {
      setLoading(true)
      setPage(0)
      setHasMore(true)
    } else {
      setIsLoadingMore(true)
    }

    try {
      const today = new Date()
      const pageSize = 50
      const currentPage = resetData ? 0 : page

      // First get all data for stats (handles Supabase 1000 row limit)
      const allData = await fetchAllData()
      calculateRatingStats(allData)

      // Extract unique values from all data
      const uniqueSectors = [...new Set(allData.map(item => item.sector).filter(Boolean))]
      const uniqueIndustries = [...new Set(allData.map(item => item.industry).filter(Boolean))]
      const uniqueRatings = [...new Set(allData.map(item => item.rating).filter(Boolean))]
      
      setSectors(uniqueSectors.sort())
      setIndustries(uniqueIndustries.sort())
      setRatings(uniqueRatings.sort())

      // Build query for paginated display data
      let query = supabase
        .from(selectedExchange)
        .select('*', { count: 'exact' })
        .gte('prediction_date', today.toISOString().split('T')[0])

      if (symbolFilter) {
        query = query.ilike('symbol', `${symbolFilter}%`)
      }
      if (companyFilter) {
        query = query.ilike('company_name', `%${companyFilter}%`)
      }
      if (searchTerm) {
        query = query.or(`symbol.ilike.%${searchTerm}%,company_name.ilike.%${searchTerm}%,sector.ilike.%${searchTerm}%,industry.ilike.%${searchTerm}%`)
      }
      if (selectedRating !== 'all') {
        query = query.eq('rating', selectedRating)
      }
      if (selectedSector !== 'all') {
        query = query.eq('sector', selectedSector)
      }
      if (selectedIndustry !== 'all') {
        query = query.eq('industry', selectedIndustry)
      }

      // Apply sorting
      if (sortConfig.key) {
        query = query.order(sortConfig.key, { ascending: sortConfig.direction === 'asc' })
      } else {
        query = query.order('symbol', { ascending: true })
      }

      // Fetch paginated data for display
      const { data: pageData, error, count } = await query
        .range(currentPage * pageSize, (currentPage + 1) * pageSize - 1)

      if (error) throw error

      const newData = resetData ? pageData : [...data, ...pageData]
      setData(newData)
      setHasMore(newData.length < count)
      setPage(currentPage + 1)

    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      if (resetData) {
        setLoading(false)
      } else {
        setIsLoadingMore(false)
      }
    }
  }

  useEffect(() => {
    fetchData()
  }, [selectedExchange, symbolFilter, companyFilter, searchTerm, selectedRating, selectedSector, selectedIndustry])

  const requestSort = (key) => {
    // Map UI column names to database column names
    const columnMap = {
      'buy_score': 'probability',
      'rsi': 'rsi',
      'macd': 'macd_signal',
      'vol': 'volume',
      'mcap': 'market_cap',
      'pe': 'pe_ratio',
      'roe': 'return_on_equity',
      'revg': 'revenue_growth',
      'epsg': 'earnings_growth'
    };

    let direction = 'asc';
    if (sortConfig.key === (columnMap[key] || key) && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key: columnMap[key] || key, direction });
    fetchData(true);
  };

  const SortIndicator = ({ columnKey }) => {
    if (sortConfig.key !== columnKey) return null;
    return (
      <Text as="span" ml={1}>
        {sortConfig.direction === 'asc' ? '↑' : '↓'}
      </Text>
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
            alignItems="center"
            gap={2}
            borderColor={borderColor}
            borderWidth="1px"
            flexWrap="wrap"
          >
            {/* Left side: Title and Exchange */}
            <Flex align="center" gap={2} flex="0 0 auto">
              <Flex align="center" gap={1}>
                <Heading size="sm" bgGradient="linear(to-r, blue.400, teal.400)" bgClip="text" fontWeight="bold">
                  Swift
                </Heading>
                <Heading size="sm" color={textColor} fontWeight="bold">
                  Signal
                </Heading>
              </Flex>
              <Text fontSize="xs" color={mutedTextColor}>
                {data.length > 0 ? formatDate(data[0].prediction_date) : ''}
              </Text>
              <Select
                value={selectedExchange}
                onChange={(e) => setSelectedExchange(e.target.value)}
                size="xs"
                w="80px"
              >
                <option value="nasdaq_stock_data">NASDAQ</option>
                <option value="nyse_stock_data">NYSE</option>
                <option value="lse_stock_data">LSE</option>
                <option value="fse_stock_data">FSE</option>
              </Select>
              <Button
                as={Link}
                to="/history"
                size="xs"
                colorScheme="blue"
                leftIcon={<ViewIcon />}
              >
                History
              </Button>
            </Flex>

            {/* Center: Rating Stats */}
            <Flex flex="1 1 auto" justify="center" wrap="wrap" gap={1}>
              {Object.entries(ratingStats)
                .sort((a, b) => {
                  const order = {
                    'Strong Buy': 1,
                    'Buy': 2,
                    'Weak Buy': 3,
                    'Weak Sell': 4,
                    'Sell': 5,
                    'Strong Sell': 6
                  }
                  return (order[a[0]] || 99) - (order[b[0]] || 99)
                })
                .map(([rating, stats]) => (
                  <Stat 
                    key={rating} 
                    px={2} 
                    py={0.5} 
                    bg={`${getRatingColor(rating)}.500`}
                    rounded="md" 
                    minW="90px"
                    maxW="120px"
                    textAlign="center"
                  >
                    <StatLabel 
                      color="white"
                      fontSize="2xs"
                      fontWeight="medium"
                      mb={0}
                      opacity={0.9}
                    >
                      {rating.replace('Strong ', 'S.')}
                    </StatLabel>
                    <Flex justify="center" align="center" gap={1}>
                      <StatNumber fontSize="sm" color="white" fontWeight="bold">
                        {stats.count}
                      </StatNumber>
                      <Text fontSize="xs" color="white" opacity={0.9}>
                        {formatValue(stats.avgReturn * 100, 1)}%
                      </Text>
                    </Flex>
                  </Stat>
              ))}
            </Flex>

            {/* Right side: Actions */}
            <Flex gap={1} flex="0 0 auto">
              <IconButton
                icon={colorMode === 'light' ? <MoonIcon /> : <SunIcon />}
                onClick={toggleColorMode}
                variant="ghost"
                size="sm"
                aria-label="Toggle color mode"
              />
              <Menu>
                <MenuButton
                  as={IconButton}
                  icon={<SettingsIcon />}
                  variant="ghost"
                  size="sm"
                />
                <MenuList>
                  <MenuItem as={Link} to="/history" icon={<ViewIcon />}>View History</MenuItem>
                  <MenuItem icon={<DownloadIcon />}>Download Data</MenuItem>
                  <MenuItem icon={<RepeatIcon />} onClick={() => fetchData(true)}>Refresh Data</MenuItem>
                  <MenuItem icon={<ViewIcon />}>Column Settings</MenuItem>
                </MenuList>
              </Menu>
            </Flex>
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
              <TableContainer 
                ref={tableContainerRef}
                maxH="calc(100vh - 120px)" 
                overflowY="auto"
                onScroll={(e) => {
                  const { scrollTop, scrollHeight, clientHeight } = e.target
                  if (!isLoadingMore && hasMore && scrollHeight - scrollTop <= clientHeight * 1.5) {
                    fetchData(false)
                  }
                }}
              >
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
                        <SortIndicator columnKey="probability" />
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
                        <SortIndicator columnKey="macd_signal" />
                      </Th>
                      <Th 
                        py={2} 
                        px={2} 
                        isNumeric 
                        w="80px" 
                        color={mutedTextColor}
                        cursor="pointer"
                        onClick={() => requestSort('vol')}
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
                        onClick={() => requestSort('mcap')}
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
                        onClick={() => requestSort('pe')}
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
                        onClick={() => requestSort('roe')}
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
                        onClick={() => requestSort('revg')}
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
                        onClick={() => requestSort('epsg')}
                        _hover={{ color: textColor }}
                      >
                        EPS G%
                        <SortIndicator columnKey="earnings_growth" />
                      </Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {data.map((stock) => stock && (
                      <Tr 
                        key={stock?.symbol || `unknown-${Math.random()}`} 
                        _hover={{ bg: hoverBgColor }}
                        borderColor={borderColor}
                      >
                        <Td py={0.5} px={2} fontSize="xs" fontWeight="medium">{stock?.symbol || '-'}</Td>
                        <Td py={0.5} px={2} fontSize="xs" maxW="150px" isTruncated>{stock?.company_name || '-'}</Td>
                        <Td py={0.5} px={1} fontSize="xs" w="110px">
                          <Box overflow="hidden">
                            <Badge 
                              colorScheme={stock?.sector ? getSectorColor(stock.sector) : 'gray'} 
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
                              {stock?.sector || '-'}
                            </Badge>
                          </Box>
                        </Td>
                        <Td py={0.5} px={1} fontSize="xs" w="130px">
                          <Box overflow="hidden">
                            <Badge 
                              colorScheme={stock?.industry ? getIndustryColor(stock.industry) : 'gray'} 
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
                              {stock?.industry || '-'}
                            </Badge>
                          </Box>
                        </Td>
                        <Td py={0.5} px={2} isNumeric fontSize="xs" fontWeight="medium" color={getPriceColor(stock?.daily_returns)}>
                          {formatPrice(stock?.current_price)}
                        </Td>
                        <Td py={0.5} px={2}>
                          <Badge 
                            fontSize="10px" 
                            colorScheme={stock?.rating ? getRatingColor(stock.rating) : 'gray'}
                            px={2}
                            py={0.5}
                            borderRadius="md"
                          >
                            {stock?.rating || '-'}
                          </Badge>
                        </Td>
                        <Td py={0.5} px={2} isNumeric fontSize="xs" color={getValueColor(stock?.probability, 50)}>
                          {formatValue(stock?.probability, 1, true)}
                        </Td>
                        <Td py={0.5} px={2} isNumeric fontSize="xs" color={getValueColor(stock?.rsi, 50)}>
                          {formatValue(stock?.rsi)}
                        </Td>
                        <Td py={0.5} px={2} isNumeric fontSize="xs" color={getValueColor(stock?.macd_signal)}>
                          {formatValue(stock?.macd_signal)}
                        </Td>
                        <Td py={0.5} px={2} isNumeric fontSize="xs">
                          {formatVolume(stock?.volume)}
                        </Td>
                        <Td py={0.5} px={2} isNumeric fontSize="xs">
                          {stock?.market_cap >= 1e9 
                            ? `${(stock?.market_cap / 1e9).toFixed(1)}B` 
                            : `${(stock?.market_cap / 1e6).toFixed(0)}M`}
                        </Td>
                        <Td py={0.5} px={2} isNumeric fontSize="xs" color={getValueColor(stock?.pe_ratio, 15)}>
                          {formatValue(stock?.pe_ratio)}
                        </Td>
                        <Td py={0.5} px={2} isNumeric fontSize="xs" color={getValueColor(stock?.return_on_equity)}>
                          {formatValue(stock?.return_on_equity * 100, 1, true)}
                        </Td>
                        <Td py={0.5} px={2} isNumeric fontSize="xs" color={getValueColor(stock?.revenue_growth)}>
                          {formatValue(stock?.revenue_growth * 100, 1, true)}
                        </Td>
                        <Td py={0.5} px={2} isNumeric fontSize="xs" color={getValueColor(stock?.earnings_growth)}>
                          {formatValue(stock?.earnings_growth * 100, 1, true)}
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
            <Text>Showing {data.length} of {data.length} stocks</Text>
          </Flex>
        </VStack>
      </Container>
    </Box>
  )
}

export default App
