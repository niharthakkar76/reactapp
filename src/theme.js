import { extendTheme } from '@chakra-ui/react'

const theme = extendTheme({
  config: {
    initialColorMode: 'dark',
    useSystemColorMode: false,
  },
  styles: {
    global: (props) => ({
      body: {
        bg: props.colorMode === 'dark' ? '#000000' : 'gray.50',
        color: props.colorMode === 'dark' ? '#ffffff' : 'gray.800',
      },
    }),
  },
  colors: {
    // Yahoo Finance dark theme colors
    gray: {
      50: '#f7f7f7',
      100: '#ededed',
      200: '#d3d3d3',
      300: '#b3b3b3',
      400: '#a0a0a0',
      500: '#888888', // Muted text
      600: '#6c6c6c',
      700: '#202020', // Dark gray for borders
      800: '#121212', // Card background
      900: '#000000', // Main background
    },
    brand: {
      green: {
        50: '#e6f4ea',
        100: '#ceead6',
        200: '#a8dab5',
        300: '#82ca94',
        400: '#5cb973',
        500: '#00873c', // Yahoo Finance green
        600: '#006d30',
        700: '#005224',
        800: '#003618',
        900: '#001b0c',
      },
      red: {
        50: '#ffe6e6',
        100: '#ffcccc',
        200: '#ff9999',
        300: '#ff6666',
        400: '#ff4d4d', // Yahoo Finance red
        500: '#ff0000',
        600: '#cc0000',
        700: '#990000',
        800: '#660000',
        900: '#330000',
      },
    },
  },
  components: {
    Table: {
      baseStyle: (props) => ({
        th: {
          borderColor: props.colorMode === 'dark' ? '#202020' : 'gray.200',
          color: props.colorMode === 'dark' ? '#888888' : 'gray.600',
          bg: props.colorMode === 'dark' ? '#000000' : 'white',
          fontSize: 'xs',
        },
        td: {
          borderColor: props.colorMode === 'dark' ? '#202020' : 'gray.200',
        },
      }),
    },
    Card: {
      baseStyle: (props) => ({
        container: {
          bg: props.colorMode === 'dark' ? '#121212' : 'white',
          borderColor: props.colorMode === 'dark' ? '#202020' : 'gray.200',
        },
      }),
    },
    Button: {
      variants: {
        ghost: (props) => ({
          _hover: {
            bg: props.colorMode === 'dark' ? '#1c1c1c' : 'blackAlpha.100',
          },
        }),
      },
    },
    Input: {
      variants: {
        outline: (props) => ({
          field: {
            bg: props.colorMode === 'dark' ? '#121212' : 'white',
            borderColor: props.colorMode === 'dark' ? '#202020' : 'gray.200',
            _hover: {
              borderColor: props.colorMode === 'dark' ? '#2c2c2c' : 'gray.300',
            },
            _focus: {
              borderColor: props.colorMode === 'dark' ? '#3c3c3c' : 'blue.500',
              boxShadow: 'none',
            },
          },
        }),
      },
    },
    Select: {
      variants: {
        outline: (props) => ({
          field: {
            bg: props.colorMode === 'dark' ? '#121212' : 'white',
            borderColor: props.colorMode === 'dark' ? '#202020' : 'gray.200',
            _hover: {
              borderColor: props.colorMode === 'dark' ? '#2c2c2c' : 'gray.300',
            },
          },
        }),
      },
    },
    Menu: {
      baseStyle: (props) => ({
        list: {
          bg: props.colorMode === 'dark' ? '#121212' : 'white',
          borderColor: props.colorMode === 'dark' ? '#202020' : 'gray.200',
        },
        item: {
          bg: props.colorMode === 'dark' ? '#121212' : 'white',
          _hover: {
            bg: props.colorMode === 'dark' ? '#1c1c1c' : 'gray.100',
          },
        },
      }),
    },
  },
})

export default theme
