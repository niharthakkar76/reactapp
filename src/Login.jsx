import { useState } from 'react'
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  VStack,
  useColorModeValue,
  Text,
  InputGroup,
  InputLeftElement,
  InputRightElement,
  useToast,
  Flex,
  Heading,
  Icon,
} from '@chakra-ui/react'
import { FiUser, FiLock, FiEye, FiEyeOff } from 'react-icons/fi'
import { useNavigate } from 'react-router-dom'

// Hardcoded credentials
const VALID_CREDENTIALS = {
  username: 'admin',
  password: 'admin123'
}

function Login() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const navigate = useNavigate()
  const toast = useToast()

  // Theme colors
  const bgColor = useColorModeValue('gray.50', '#000000')
  const cardBgColor = useColorModeValue('white', '#121212')
  const textColor = useColorModeValue('gray.800', '#ffffff')
  const mutedTextColor = useColorModeValue('gray.600', '#888888')
  const borderColor = useColorModeValue('gray.200', '#202020')
  const buttonBgColor = useColorModeValue('blue.500', '#1a365d')
  const buttonHoverBgColor = useColorModeValue('blue.600', '#2a4365')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000))

    if (username === VALID_CREDENTIALS.username && password === VALID_CREDENTIALS.password) {
      toast({
        title: 'Login successful',
        status: 'success',
        duration: 2000,
        isClosable: true,
      })
      // Store auth state
      localStorage.setItem('isAuthenticated', 'true')
      // Redirect to main app
      navigate('/dashboard')
    } else {
      toast({
        title: 'Invalid credentials',
        description: 'Please check your username and password',
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
    }

    setIsLoading(false)
  }

  return (
    <Box 
      minH="100vh" 
      w="100vw"
      bg={bgColor} 
      display="flex" 
      alignItems="center" 
      justifyContent="center"
      position="fixed"
      top="0"
      left="0"
    >
      <Box
        w="100%"
        maxW="500px"
        mx="auto"
        px={4}
      >
        <Flex
          w="100%"
          direction="column"
          gap={10}
          p={12}
          bg={cardBgColor}
          borderRadius="xl"
          boxShadow="2xl"
          borderWidth="1px"
          borderColor={borderColor}
        >
          <VStack spacing={6} align="center">
            <Icon as={FiUser} boxSize={16} color={mutedTextColor} />
            <Heading size="xl" color={textColor}>Welcome Back</Heading>
            <Text fontSize="lg" color={mutedTextColor}>Enter your credentials to continue</Text>
          </VStack>

          <form onSubmit={handleSubmit}>
            <VStack spacing={6}>
              <FormControl isRequired>
                <FormLabel fontSize="md" color={mutedTextColor}>Username</FormLabel>
                <InputGroup size="lg">
                  <InputLeftElement pointerEvents="none">
                    <FiUser color="#888888" />
                  </InputLeftElement>
                  <Input
                    type="text"
                    placeholder="Enter username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    bg={cardBgColor}
                    borderColor={borderColor}
                    color={textColor}
                    _placeholder={{ color: mutedTextColor }}
                    _hover={{ borderColor: 'blue.400' }}
                    _focus={{ borderColor: 'blue.400', boxShadow: 'none' }}
                    fontSize="md"
                    h="50px"
                  />
                </InputGroup>
              </FormControl>

              <FormControl isRequired>
                <FormLabel fontSize="md" color={mutedTextColor}>Password</FormLabel>
                <InputGroup size="lg">
                  <InputLeftElement pointerEvents="none">
                    <FiLock color="#888888" />
                  </InputLeftElement>
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    bg={cardBgColor}
                    borderColor={borderColor}
                    color={textColor}
                    _placeholder={{ color: mutedTextColor }}
                    _hover={{ borderColor: 'blue.400' }}
                    _focus={{ borderColor: 'blue.400', boxShadow: 'none' }}
                    fontSize="md"
                    h="50px"
                  />
                  <InputRightElement width="4.5rem">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowPassword(!showPassword)}
                      color={mutedTextColor}
                      _hover={{ bg: 'transparent' }}
                    >
                      <Icon as={showPassword ? FiEyeOff : FiEye} boxSize={5} />
                    </Button>
                  </InputRightElement>
                </InputGroup>
              </FormControl>

              <Button
                type="submit"
                w="full"
                bg={buttonBgColor}
                color="white"
                _hover={{ bg: buttonHoverBgColor }}
                _active={{ bg: buttonHoverBgColor }}
                isLoading={isLoading}
                loadingText="Signing in..."
                h="50px"
                fontSize="lg"
                mt={4}
              >
                Sign In
              </Button>
            </VStack>
          </form>
        </Flex>
      </Box>
    </Box>
  )
}

export default Login
