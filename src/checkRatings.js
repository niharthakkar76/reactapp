import { createClient } from '@supabase/supabase-js'

// Initialize the Supabase client
const supabaseUrl = "https://dcitsfjssvlgtqfqrriq.supabase.co"
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRjaXRzZmpzc3ZsZ3RxZnFycmlxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0MjEyMDE1MSwiZXhwIjoyMDU3Njk2MTUxfQ.PtHlriHLSyrfxdvSvprlL4S5OulQBlv-XKOJmoB659o"
const supabase = createClient(supabaseUrl, supabaseKey)

async function analyzeRatings() {
    const exchanges = [
        'nasdaq_predictions',
        'nyse_predictions',
        'lse_predictions',
        'fse_predictions'
    ]

    for (const exchange of exchanges) {
        console.log(`\n\n=== Analyzing ${exchange} ===`)
        
        try {
            // Get today's date in UTC
            const today = new Date()
            today.setHours(0, 0, 0, 0)

            // Get all records for today
            const { data: todayData, error: dataError } = await supabase
                .from(exchange)
                .select('*')
                .gte('prediction_date', today.toISOString())

            if (dataError) {
                console.error(`Error fetching data for ${exchange}:`, dataError)
                continue
            }

            if (!todayData || todayData.length === 0) {
                console.log(`No data found for ${exchange} today`)
                continue
            }

            // Analyze ratings
            const ratingCounts = {}
            const ratingStats = {}
            
            todayData.forEach(record => {
                const rating = record.rating || 'NULL'
                
                // Count ratings
                ratingCounts[rating] = (ratingCounts[rating] || 0) + 1
                
                // Collect stats for each rating
                if (!ratingStats[rating]) {
                    ratingStats[rating] = {
                        count: 0,
                        totalReturn: 0,
                        minReturn: Infinity,
                        maxReturn: -Infinity,
                        examples: []
                    }
                }
                
                const stats = ratingStats[rating]
                stats.count++
                if (record.expected_return) {
                    stats.totalReturn += record.expected_return
                    stats.minReturn = Math.min(stats.minReturn, record.expected_return)
                    stats.maxReturn = Math.max(stats.maxReturn, record.expected_return)
                }
                if (stats.examples.length < 3) {
                    stats.examples.push({
                        symbol: record.symbol,
                        current_price: record.current_price,
                        predicted_price: record.predicted_price,
                        expected_return: record.expected_return,
                        probability: record.probability
                    })
                }
            })

            // Print analysis
            console.log(`\nTotal records: ${todayData.length}`)
            console.log('\nRating Distribution:')
            console.log('==================')
            
            Object.entries(ratingStats).sort((a, b) => b[1].count - a[1].count).forEach(([rating, stats]) => {
                const percentage = ((stats.count / todayData.length) * 100).toFixed(2)
                const avgReturn = stats.count > 0 ? ((stats.totalReturn / stats.count) * 100).toFixed(2) : 'N/A'
                const minReturn = stats.minReturn !== Infinity ? `${(stats.minReturn * 100).toFixed(2)}%` : 'N/A'
                const maxReturn = stats.maxReturn !== -Infinity ? `${(stats.maxReturn * 100).toFixed(2)}%` : 'N/A'
                
                console.log(`\nRating: ${rating}`)
                console.log(`Count: ${stats.count} (${percentage}%)`)
                console.log(`Average Return: ${avgReturn}%`)
                console.log(`Return Range: ${minReturn} to ${maxReturn}`)
                
                if (stats.examples.length > 0) {
                    console.log('Example stocks:')
                    stats.examples.forEach(example => {
                        console.log(`  ${example.symbol}: Current $${example.current_price?.toFixed(2)}, ` +
                            `Predicted $${example.predicted_price?.toFixed(2)}, ` +
                            `Return ${(example.expected_return * 100)?.toFixed(2)}%, ` +
                            `Probability ${example.probability?.toFixed(2)}%`)
                    })
                }
                console.log('------------------')
            })

            // Check for unexpected rating values
            const expectedRatings = ['Strong Buy', 'Buy', 'Weak Buy', 'Hold', 'Weak Sell', 'Sell', 'Strong Sell', null]
            const unexpectedRatings = todayData.filter(record => 
                !expectedRatings.includes(record.rating)
            )

            if (unexpectedRatings.length > 0) {
                console.log('\nUnexpected rating values found:')
                unexpectedRatings.forEach(record => {
                    console.log(`${record.symbol}: "${record.rating}"`)
                })
            }

        } catch (error) {
            console.error(`Error analyzing ${exchange}:`, error)
        }
    }
}

// Run the analysis
console.log('Starting database analysis...')
analyzeRatings()
    .then(() => console.log('\nAnalysis complete!'))
    .catch(error => console.error('Fatal error:', error))
