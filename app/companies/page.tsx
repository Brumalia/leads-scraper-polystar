'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'

interface Company {
  id: string
  name: string
  location: string | null
  email: string | null
  website: string | null
  business_type: string | null
  industry: string | null
  company_size: string | null
  is_contract_packer: boolean
  is_growing: boolean
  scraped_at: string
}

interface PaginatedResponse {
  companies: Company[]
  pagination: {
    page: number
    limit: number
    totalCount: number
    totalPages: number
  }
}

export default function CompaniesPage() {
  const [companies, setCompanies] = useState<Company[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [location, setLocation] = useState('')
  const [businessType, setBusinessType] = useState('')
  const [industry, setIndustry] = useState('')
  const [companySize, setCompanySize] = useState('')
  const [isContractPacker, setIsContractPacker] = useState('')
  const [isGrowing, setIsGrowing] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [totalCount, setTotalCount] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [exporting, setExporting] = useState(false)

  // Fetch companies data
  const fetchCompanies = useCallback(async (page: number = 1) => {
    setLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: pageSize.toString(),
      })

      if (search) params.append('search', search)
      if (location) params.append('location', location)
      if (businessType) params.append('business_type', businessType)
      if (industry) params.append('industry', industry)
      if (companySize) params.append('company_size', companySize)
      if (isContractPacker) params.append('is_contract_packer', isContractPacker)
      if (isGrowing) params.append('is_growing', isGrowing)

      const response = await fetch(`/api/companies?${params.toString()}`)

      if (!response.ok) {
        throw new Error('Failed to fetch companies')
      }

      const data: PaginatedResponse = await response.json()
      setCompanies(data.companies)
      setTotalCount(data.pagination.totalCount)
      setTotalPages(data.pagination.totalPages)
      setCurrentPage(data.pagination.page)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }, [search, location, businessType, industry, companySize, isContractPacker, isGrowing, pageSize])

  // Handle search input
  const handleSearch = (value: string) => {
    setSearch(value)
    setCurrentPage(1)
  }

  // Handle location filter
  const handleLocationFilter = (value: string) => {
    setLocation(value)
    setCurrentPage(1)
  }

  // Handle business type filter
  const handleBusinessTypeFilter = (value: string) => {
    setBusinessType(value)
    setCurrentPage(1)
  }

  // Handle industry filter
  const handleIndustryFilter = (value: string) => {
    setIndustry(value)
    setCurrentPage(1)
  }

  // Handle company size filter
  const handleCompanySizeFilter = (value: string) => {
    setCompanySize(value)
    setCurrentPage(1)
  }

  // Handle contract packer filter
  const handleContractPackerFilter = (value: string) => {
    setIsContractPacker(value)
    setCurrentPage(1)
  }

  // Handle growing filter
  const handleGrowingFilter = (value: string) => {
    setIsGrowing(value)
    setCurrentPage(1)
  }

  // Handle export to CSV
  const handleExport = async () => {
    setExporting(true)
    try {
      const params = new URLSearchParams()
      if (search) params.append('search', search)
      if (location) params.append('location', location)
      if (businessType) params.append('business_type', businessType)
      if (industry) params.append('industry', industry)
      if (companySize) params.append('company_size', companySize)
      if (isContractPacker) params.append('is_contract_packer', isContractPacker)
      if (isGrowing) params.append('is_growing', isGrowing)

      const response = await fetch(`/api/export/csv?${params.toString()}`)

      if (!response.ok) {
        throw new Error('Failed to export data')
      }

      // Get blob and trigger download
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `companies-export-${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to export data')
    } finally {
      setExporting(false)
    }
  }

  // Debounce search to avoid too many API calls
  useEffect(() => {
    const timer = setTimeout(() => {
      if (currentPage === 1) {
        fetchCompanies(1)
      } else {
        fetchCompanies(currentPage)
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [fetchCompanies, currentPage])

  // Reset filters
  const handleResetFilters = () => {
    setSearch('')
    setLocation('')
    setBusinessType('')
    setIndustry('')
    setCompanySize('')
    setIsContractPacker('')
    setIsGrowing('')
    setCurrentPage(1)
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black">
      {/* Header */}
      <header className="bg-white dark:bg-black border-b border-zinc-200 dark:border-zinc-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
              Companies Dashboard
            </h1>
            <Link
              href="/"
              className="text-sm text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-50 transition-colors"
            >
              Back to Home
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters Section */}
        <div className="bg-white dark:bg-black rounded-lg shadow-sm border border-zinc-200 dark:border-zinc-800 p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-4">
            {/* Search */}
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                Search
              </label>
              <input
                type="text"
                value={search}
                onChange={(e) => handleSearch(e.target.value)}
                placeholder="Search name or email..."
                className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-500 dark:focus:ring-zinc-600 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-50"
              />
            </div>

            {/* Location Filter */}
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                Location
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => handleLocationFilter(e.target.value)}
                placeholder="Filter by location..."
                className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-500 dark:focus:ring-zinc-600 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-50"
              />
            </div>

            {/* Business Type Filter */}
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                Business Type
              </label>
              <select
                value={businessType}
                onChange={(e) => handleBusinessTypeFilter(e.target.value)}
                className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-500 dark:focus:ring-zinc-600 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-50"
              >
                <option value="">All Types</option>
                <option value="Food Production">Food Production</option>
                <option value="Beverage">Beverage</option>
                <option value="Restaurant">Restaurant</option>
                <option value="Catering">Catering</option>
                <option value="Retail">Retail</option>
              </select>
            </div>

            {/* Industry Filter */}
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                Industry
              </label>
              <select
                value={industry}
                onChange={(e) => handleIndustryFilter(e.target.value)}
                className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-500 dark:focus:ring-zinc-600 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-50"
              >
                <option value="">All Industries</option>
                <option value="food & drink">Food & Drink</option>
                <option value="pharma">Pharma</option>
                <option value="chemicals">Chemicals</option>
              </select>
            </div>

            {/* Company Size Filter */}
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                Company Size
              </label>
              <select
                value={companySize}
                onChange={(e) => handleCompanySizeFilter(e.target.value)}
                className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-500 dark:focus:ring-zinc-600 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-50"
              >
                <option value="">All Sizes</option>
                <option value="micro">Micro (&lt;10)</option>
                <option value="small">Small (10-50)</option>
                <option value="medium">Medium (50-250)</option>
                <option value="large">Large (250+)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Contract Packer Toggle */}
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                Contract Packer
              </label>
              <select
                value={isContractPacker}
                onChange={(e) => handleContractPackerFilter(e.target.value)}
                className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-500 dark:focus:ring-zinc-600 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-50"
              >
                <option value="">All</option>
                <option value="true">Yes</option>
                <option value="false">No</option>
              </select>
            </div>

            {/* Growing Toggle */}
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                Growing
              </label>
              <select
                value={isGrowing}
                onChange={(e) => handleGrowingFilter(e.target.value)}
                className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-500 dark:focus:ring-zinc-600 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-50"
              >
                <option value="">All</option>
                <option value="true">Yes</option>
                <option value="false">No</option>
              </select>
            </div>

            {/* Page Size Selector */}
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                Per Page
              </label>
              <select
                value={pageSize}
                onChange={(e) => setPageSize(parseInt(e.target.value))}
                className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-500 dark:focus:ring-zinc-600 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-50"
              >
                <option value="5">5</option>
                <option value="10">10</option>
                <option value="25">25</option>
                <option value="50">50</option>
              </select>
            </div>

            {/* Reset and Export Buttons */}
            <div className="flex items-end gap-2">
              <button
                onClick={handleResetFilters}
                className="flex-1 px-4 py-2 border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors font-medium"
              >
                Reset
              </button>
              <button
                onClick={handleExport}
                disabled={exporting || loading}
                className="flex-1 px-4 py-2 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-lg hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {exporting ? 'Exporting...' : 'Export CSV'}
              </button>
            </div>
          </div>

          {/* Results Count */}
          <div className="mt-4 text-sm text-zinc-600 dark:text-zinc-400">
            {loading ? (
              'Loading...'
            ) : (
              `Showing ${companies.length} of ${totalCount} companies`
            )}
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-300 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* Companies Table */}
        <div className="bg-white dark:bg-black rounded-lg shadow-sm border border-zinc-200 dark:border-zinc-800 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-zinc-900 dark:border-zinc-50"></div>
            </div>
          ) : companies.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-zinc-500 dark:text-zinc-400">
              <svg
                className="w-12 h-12 mb-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <p className="text-lg font-medium">No companies found</p>
              <p className="text-sm mt-1">Try adjusting your filters or search terms</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-zinc-50 dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider">
                        Company Name
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider">
                        Location
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider">
                        Email
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider">
                        Website
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider">
                        Business Type
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider">
                        Date Scraped
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                    {companies.map((company) => (
                      <tr
                        key={company.id}
                        className="hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors"
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
                            {company.name}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-zinc-600 dark:text-zinc-400">
                            {company.location || '-'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-zinc-600 dark:text-zinc-400">
                            {company.email ? (
                              <a
                                href={`mailto:${company.email}`}
                                className="text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-50"
                              >
                                {company.email}
                              </a>
                            ) : (
                              '-'
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-zinc-600 dark:text-zinc-400">
                            {company.website ? (
                              <a
                                href={company.website}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-50"
                              >
                                {company.website}
                              </a>
                            ) : (
                              '-'
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-zinc-600 dark:text-zinc-400">
                            {company.business_type || '-'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-zinc-600 dark:text-zinc-400">
                            {company.scraped_at
                              ? new Date(company.scraped_at).toLocaleDateString('en-GB')
                              : '-'}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 px-6 py-4">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                  {/* Page Size Selector */}
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-zinc-600 dark:text-zinc-400">
                      Show per page:
                    </span>
                    <select
                      value={pageSize}
                      onChange={(e) => {
                        setPageSize(parseInt(e.target.value))
                        setCurrentPage(1)
                      }}
                      className="px-3 py-1 border border-zinc-300 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-500 dark:focus:ring-zinc-600 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-50 text-sm"
                    >
                      <option value="5">5</option>
                      <option value="10">10</option>
                      <option value="25">25</option>
                      <option value="50">50</option>
                    </select>
                  </div>

                  {/* Page Navigation */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                      className="px-3 py-1 border border-zinc-300 dark:border-zinc-700 rounded-lg text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      Previous
                    </button>

                    <span className="text-sm text-zinc-600 dark:text-zinc-400">
                      Page {currentPage} of {totalPages}
                    </span>

                    <button
                      onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                      className="px-3 py-1 border border-zinc-300 dark:border-zinc-700 rounded-lg text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      Next
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  )
}
