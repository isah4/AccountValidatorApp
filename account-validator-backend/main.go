package main

import (
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"strings"
	"sync"
	"time"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

// Global variable for API keys
var apiKeys []string

// Request and response structs
type ValidateAccountRequest struct {
	AccountNumber string `json:"account_number"`
	BankCode      string `json:"bank_code"`
	Name          string `json:"name,omitempty"` // Made optional
}

type SearchAccountRequest struct {
	AccountNumber string `json:"account_number"`
	BankCode      string `json:"bank_code"`
	Name          string `json:"name,omitempty"` // Made optional
}

type AccountResponse struct {
	IsValid       bool   `json:"isValid"`
	AccountNumber string `json:"account_number,omitempty"`
	AccountName   string `json:"account_name,omitempty"`
	FirstName     string `json:"first_name,omitempty"`
	LastName      string `json:"last_name,omitempty"`
	OtherName     string `json:"other_name,omitempty"`
	BankName      string `json:"bank_name,omitempty"`
	BankCode      string `json:"bank_code,omitempty"`
	Message       string `json:"message,omitempty"`
}

type SearchResponse struct {
	IsValid  bool              `json:"isValid"`
	Accounts []AccountResponse `json:"accounts,omitempty"`
	Message  string            `json:"message,omitempty"`
}

type AccountDetails struct {
	Status        interface{} `json:"status"`
	AccountName   string      `json:"account_name"`
	FirstName     string      `json:"first_name"`
	LastName      string      `json:"last_name"`
	OtherName     string      `json:"other_name"`
	BankName      string      `json:"bank_name"`
	BankCode      string      `json:"bank_code"`
	AccountNumber string      `json:"account_number"`
}

func (a *AccountDetails) IsValid() bool {
	switch v := a.Status.(type) {
	case bool:
		return v
	case float64:
		return v == 200
	case int:
		return v == 200
	default:
		return false
	}
}

type ValidatorAPI struct {
	ApiKey       string
	BaseURL      string
	Client       *http.Client
	Limiter      *time.Ticker
	LastRequest  time.Time
	RequestCount int
	Mutex        sync.Mutex
	MaxRequests  int
}

func NewValidator(apiKey string) *ValidatorAPI {
	return &ValidatorAPI{
		ApiKey:      apiKey,
		BaseURL:     "https://nubapi.com/api/verify",
		MaxRequests: 60,
		Client: &http.Client{
			Timeout: 10 * time.Second,
		},
		LastRequest:  time.Now().Add(-1 * time.Minute),
		RequestCount: 0,
	}
}

func (v *ValidatorAPI) checkRateLimit() bool {
	v.Mutex.Lock()
	defer v.Mutex.Unlock()

	now := time.Now()
	if now.Sub(v.LastRequest) > time.Minute {
		v.RequestCount = 0
		v.LastRequest = now
		return true
	}

	if v.RequestCount < v.MaxRequests {
		v.RequestCount++
		v.LastRequest = now
		return true
	}

	return false
}

func (v *ValidatorAPI) waitForRateLimit() {
	for {
		if v.checkRateLimit() {
			return
		}
		time.Sleep(500 * time.Millisecond)
	}
}

func (v *ValidatorAPI) ValidateAccount(accountNumber, bankCode string) (AccountDetails, error) {
	v.waitForRateLimit()
	url := fmt.Sprintf("%s?account_number=%s&bank_code=%s", v.BaseURL, accountNumber, bankCode)

	req, err := http.NewRequest("GET", url, nil)
	if err != nil {
		return AccountDetails{}, err
	}

	req.Header.Set("Authorization", "Bearer "+v.ApiKey)
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Accept", "application/json")

	resp, err := v.Client.Do(req)
	if err != nil {
		return AccountDetails{}, err
	}
	defer resp.Body.Close()

	if resp.StatusCode == 429 {
		return AccountDetails{}, fmt.Errorf("rate limited (429)")
	}

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return AccountDetails{}, fmt.Errorf("API error (status %d): %s", resp.StatusCode, string(body))
	}

	var result AccountDetails
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return AccountDetails{}, fmt.Errorf("JSON parse error: %v", err)
	}

	return result, nil
}

func matchesNameCriteria(account AccountDetails, nameWords []string) bool {
	fullName := strings.ToLower(account.AccountName + " " + account.FirstName + " " + account.LastName + " " + account.OtherName)
	for _, word := range nameWords {
		if !strings.Contains(fullName, strings.ToLower(word)) {
			return false
		}
	}
	return true
}

func generateAccountNumbers(pattern string) []string {
	if !strings.Contains(pattern, "*") {
		return []string{pattern}
	}

	var results []string
	asteriskCount := strings.Count(pattern, "*")
	totalCombinations := int(1)
	for i := 0; i < asteriskCount; i++ {
		totalCombinations *= 10
	}

	for i := 0; i < totalCombinations; i++ {
		temp := pattern
		digits := fmt.Sprintf("%0*d", asteriskCount, i)
		digitIndex := 0
		for j := 0; j < len(pattern); j++ {
			if pattern[j] == '*' {
				temp = temp[:j] + string(digits[digitIndex]) + temp[j+1:]
				digitIndex++
			}
		}
		results = append(results, temp)
	}

	return results
}

func setupRouter() *gin.Engine {
	r := gin.Default()

	// Configure CORS
	r.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"*"},
		AllowMethods:     []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Accept", "Authorization"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
		MaxAge:           12 * time.Hour,
	}))

	// API endpoints
	r.POST("/api/validate-account", validateAccountHandler)
	r.POST("/api/search-account", searchAccountHandler)

	return r
}

func validateAccountHandler(c *gin.Context) {
	var req ValidateAccountRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		log.Printf("Error binding JSON: %v", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request format"})
		return
	}

	// Log the incoming request
	log.Printf("Received validation request: %+v", req)

	// Check for pattern in validate endpoint
	if strings.Contains(req.AccountNumber, "*") {
		c.JSON(http.StatusBadRequest, AccountResponse{
			IsValid: false,
			Message: "Please use /api/search-account for partial account numbers",
		})
		return
	}

	// Validate input
	if len(req.AccountNumber) != 10 {
		c.JSON(http.StatusBadRequest, AccountResponse{
			IsValid: false,
			Message: "Account number must be exactly 10 digits",
		})
		return
	}

	if req.BankCode == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Bank code is required"})
		return
	}

	// Select a validator from available API keys
	validator := NewValidator(apiKeys[0])
	log.Printf("Using validator with API key: %s", apiKeys[0])

	// Call the validation API with retries
	var accountDetails AccountDetails
	var err error
	success := false

	for attempt := 0; attempt < 3; attempt++ {
		if attempt > 0 {
			time.Sleep(time.Duration(attempt*2) * time.Second)
		}

		log.Printf("Attempt %d: Validating account...", attempt+1)
		accountDetails, err = validator.ValidateAccount(req.AccountNumber, req.BankCode)
		if err == nil {
			success = true
			log.Printf("Validation successful: %+v", accountDetails)
			break
		}

		log.Printf("Validate attempt %d failed: %v", attempt+1, err)
	}

	if !success {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "Failed to validate account after multiple attempts",
			"details": err.Error(),
		})
		return
	}

	// Check if account is valid
	if !accountDetails.IsValid() {
		log.Printf("Account validation failed: %+v", accountDetails)
		c.JSON(http.StatusOK, AccountResponse{
			IsValid: false,
			Message: "Account validation failed",
		})
		return
	}

	// Check name match only if name is provided
	if req.Name != "" {
		nameWords := strings.Fields(req.Name)
		if !matchesNameCriteria(accountDetails, nameWords) {
			log.Printf("Name mismatch. Expected: %s, Got: %s", req.Name, accountDetails.AccountName)
			c.JSON(http.StatusOK, AccountResponse{
				IsValid: false,
				Message: "Account name does not match provided name",
			})
			return
		}
	}

	// Return successful response
	c.JSON(http.StatusOK, AccountResponse{
		IsValid:       true,
		AccountNumber: accountDetails.AccountNumber,
		AccountName:   accountDetails.AccountName,
		FirstName:     accountDetails.FirstName,
		LastName:      accountDetails.LastName,
		OtherName:     accountDetails.OtherName,
		BankName:      accountDetails.BankName,
		BankCode:      accountDetails.BankCode,
	})
}

func searchAccountHandler(c *gin.Context) {
	var req SearchAccountRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request format"})
		return
	}

	// Validate that the pattern contains asterisks
	if !strings.Contains(req.AccountNumber, "*") {
		c.JSON(http.StatusBadRequest, AccountResponse{
			IsValid: false,
			Message: "Search pattern must contain '*' for unknown digits",
		})
		return
	}

	// Validate pattern length
	if len(req.AccountNumber) != 10 {
		c.JSON(http.StatusBadRequest, AccountResponse{
			IsValid: false,
			Message: "Account number pattern must be exactly 10 characters",
		})
		return
	}

	if req.BankCode == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Bank code is required"})
		return
	}

	// Parse name into words for matching if provided
	var nameWords []string
	if req.Name != "" {
		nameWords = strings.Fields(req.Name)
	}

	// Generate all possible account numbers based on the pattern
	possibleAccounts := generateAccountNumbers(req.AccountNumber)
	totalAccounts := len(possibleAccounts)
	accountsPerWorker := totalAccounts / len(apiKeys)
	if accountsPerWorker == 0 {
		accountsPerWorker = 1
	}

	// Create channels for coordination
	resultChan := make(chan AccountDetails, 100) // Increased buffer size
	stopChan := make(chan struct{})
	var wg sync.WaitGroup

	// Distribute work among workers
	for i := 0; i < len(apiKeys) && i*accountsPerWorker < totalAccounts; i++ {
		start := i * accountsPerWorker
		end := (i + 1) * accountsPerWorker
		if i == len(apiKeys)-1 || end > totalAccounts {
			end = totalAccounts
		}

		validator := NewValidator(apiKeys[i])
		wg.Add(1)
		go func(workerID int, accounts []string) {
			defer wg.Done()
			log.Printf("Worker %d starting search for %d accounts\n", workerID, len(accounts))

			for _, acc := range accounts {
				select {
				case <-stopChan:
					return
				default:
					accountDetails, err := validator.ValidateAccount(acc, req.BankCode)
					if err != nil {
						continue
					}

					if !accountDetails.IsValid() {
						continue
					}

					// If name is provided, check match
					if len(nameWords) > 0 {
						if matchesNameCriteria(accountDetails, nameWords) {
							log.Printf("[MATCH FOUND] Worker %d found: %s - %s\n",
								workerID, acc, accountDetails.AccountName)
							resultChan <- accountDetails
							return // Stop searching after first match if name provided
						}
					} else {
						// If no name provided, collect all valid accounts
						log.Printf("[VALID ACCOUNT] Worker %d found: %s - %s\n",
							workerID, acc, accountDetails.AccountName)
						resultChan <- accountDetails
					}
				}
			}
		}(i+1, possibleAccounts[start:end])
	}

	// Create done channel and handle results
	done := make(chan struct{})
	go func() {
		wg.Wait()
		close(done)
	}()

	var foundAccounts []AccountResponse
	collecting := true

	// Collect results until timeout or completion
	for collecting {
		select {
		case account := <-resultChan:
			foundAccounts = append(foundAccounts, AccountResponse{
				IsValid:       true,
				AccountNumber: account.AccountNumber,
				AccountName:   account.AccountName,
				FirstName:     account.FirstName,
				LastName:      account.LastName,
				OtherName:     account.OtherName,
				BankName:      account.BankName,
				BankCode:      account.BankCode,
			})

			// If name was provided, stop after first match
			if len(nameWords) > 0 {
				collecting = false
				close(stopChan)
			}

		case <-done:
			collecting = false

		case <-time.After(300 * time.Second):
			collecting = false
			close(stopChan)
			log.Println("Search timed out after 300 seconds")
		}
	}

	if len(foundAccounts) > 0 {
		c.JSON(http.StatusOK, gin.H{
			"isValid":  true,
			"accounts": foundAccounts,
		})
	} else {
		c.JSON(http.StatusOK, gin.H{
			"isValid": false,
			"message": "No matching accounts found",
		})
	}
}

func main() {
	// Initialize API keys
	apiKeys = []string{
		"ntzrFf6tNxxuIM0UT6KushOueqNVv1F0IYOrRk3091bad083",
		"fg4ocYRDXx2mTQTluy4VqtYuOpOWCMotK7J5eSgI589c596e",
		"jKAmMd1aHYOdoaLg331gzBattJhWJ9e1CLCiH6fA8fa7512e",
		"yW0G4exGsQXQnQUPR1kmIxJ78HlNLF2EOIjqjHnz0aeef9a7",
		"FRl6EHSDW1tdkL5ZtdO7nx5S16CEseiEAkubABxD24824043",
		"CqZvoIyCBYb3kJU5z8RNaYAJJMjPi73wxIoiSHw3cffaa718",
		"Rcwd325BPm0iQS2Avo5SudnOBUTMW6Y9WMvITc1l5845b7bc",
		"ftQrqLATUmSbuy2T8Q6XIR4iOwKgUBYJojQuEXjXc63842d8",
		"gujhcxEhG4yLBTSf4qzpzINjJtmrh71gg7WqFJTLfe4413fd",
		"xYKutxhEooXpXdjnhoVC2M8n0BfMThhiiWgIKXe4d849c097",
		"A1cbMD9lw5W4pUtkKovmvJeT8ZqXDxBv2YhoZ5w2c2a2438d",
		"w7R5qHWUJmaOrPek7cq8b3OBq7YBmsW1y5rvd6xt47180bb6",
		"1pvlbIxJmrqbJoEif3kiZKSETFCyjAEUJmLqD11N485c20e5",
		"t2nduv5WTrOQGPfOmwn8pLl55u3eBkkWNVYQBMOj82565ee6",
		"A1glNS2ATDKq15LE72N4vVSNd1lYdrSDqMAjIKpQ94c59e79",
		"BpE0Rkn5H0FeQpHIPj4JgNjjPEFYS6WEI8cIrOxT57e0ca2c",
		"qyJ5WH06JYd7aFQ6OLA85au3AWIrGEMa612L8x7i484f1fbd",
		"OkRP5FzkJo2pOeUNxfGw4fgf3wdAg2HUOeCi2Vo7a50aad02",
		"PUUqcRtNxYQG7UjNdfUUmIF77LjgCTvdDmIZ8or1891d089f",
		"hirzPe2MjJESOqDObwCyTelai85KPYQxeaKrYMPC0bf777a1",
	}

	r := setupRouter()

	log.Println("Starting server on :8080")
	if err := r.Run(":8080"); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}
