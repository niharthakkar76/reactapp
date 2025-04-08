import { useParams, useSearchParams } from 'react-router-dom';
import { 
  Box, 
  Container, 
  Heading, 
  VStack, 
  Flex, 
  IconButton, 
  useColorMode,
  useColorModeValue,
  HStack,
  Badge,
  Grid,
  GridItem
} from '@chakra-ui/react';
import { SunIcon, MoonIcon, ArrowBackIcon } from '@chakra-ui/icons';
import { Link } from 'react-router-dom';
import TradingviewSymbolChart from './components/TradingviewSymbolChart';
import TradingViewSymbolInfo from './components/TradingViewSymbolInfo';
import TradingViewFinancials from './components/TradingViewFinancials';

function StockDetails() {
  const { symbol } = useParams();
  const [searchParams] = useSearchParams();
  const exchange = searchParams.get('exchange');
  const { colorMode, toggleColorMode } = useColorMode();

  // Theme colors
  const bgColor = useColorModeValue('gray.50', '#000000');
  const cardBgColor = useColorModeValue('white', '#121212');
  const textColor = useColorModeValue('gray.800', '#ffffff');
  const borderColor = useColorModeValue('gray.200', '#202020');

  // Exchange display name mapping
  const exchangeDisplayName = {
    'nasdaq_predictions': 'NASDAQ',
    'nyse_predictions': 'NYSE',
    'lse_predictions': 'LSE',
    'fse_predictions': 'FSE'
  };

  return (
    <Box minH="100vh" bg={bgColor}>
      {/* Header */}
      <Flex 
        bg={cardBgColor} 
        p={4} 
        borderBottom="1px" 
        borderColor={borderColor}
        position="fixed"
        top={0}
        left={0}
        right={0}
        zIndex={10}
      >
        <Container maxW="container.xl">
          <Flex justify="space-between" align="center">
            <HStack spacing={4}>
              <IconButton
                as={Link}
                to="/dashboard"
                icon={<ArrowBackIcon />}
                variant="ghost"
                size="sm"
                aria-label="Go back"
              />
              <VStack align="start" spacing={0}>
                <Heading size="md" color={textColor}>{symbol}</Heading>
                <Badge colorScheme="blue">
                  {exchangeDisplayName[exchange] || exchange}
                </Badge>
              </VStack>
            </HStack>
            <IconButton
              icon={colorMode === 'light' ? <MoonIcon /> : <SunIcon />}
              onClick={toggleColorMode}
              variant="ghost"
              size="sm"
              aria-label="Toggle color mode"
            />
          </Flex>
        </Container>
      </Flex>

      {/* Main Content */}
      <Container maxW="container.xl" pt="90px" pb={8}>
        <Grid
          templateColumns={{ base: "1fr", lg: "350px 1fr" }}
          gap={4}
        >
          {/* Left Column - Info and Financials */}
          <GridItem>
            <VStack spacing={4}>
              <Box 
                w="100%" 
              >
                <TradingViewSymbolInfo 
                  symbol={symbol} 
                  exchange={exchange} 
                  theme={colorMode}
                />
              </Box>
              <Box 
                w="100%" 
              >
                <TradingViewFinancials 
                  symbol={symbol} 
                  exchange={exchange} 
                  theme={colorMode}
                />
              </Box>
            </VStack>
          </GridItem>

          {/* Right Column - Chart */}
          <GridItem>
            <Box 
              bg={cardBgColor} 
              borderRadius="lg" 
              height="calc(100vh - 120px)"
            >
              <TradingviewSymbolChart 
                symbol={symbol} 
                exchange={exchange} 
                theme={colorMode}
              />
            </Box>
          </GridItem>
        </Grid>
      </Container>
    </Box>
  );
}

export default StockDetails;