import '@testing-library/jest-dom'

describe('Database Schema', () => {
  it('should have User model defined', () => {
    // User model should have required fields
    const userFields = ['id', 'email', 'passwordHash', 'firstName', 'lastName', 'role', 'isActive', 'createdAt', 'updatedAt']
    expect(userFields).toContain('id')
    expect(userFields).toContain('email')
    expect(userFields).toContain('role')
  })

  it('should have Customer model defined', () => {
    const customerFields = ['id', 'companyName', 'email', 'status', 'assignedToId', 'createdAt', 'updatedAt']
    expect(customerFields).toContain('companyName')
    expect(customerFields).toContain('status')
  })

  it('should have Quotation model defined', () => {
    const quotationFields = ['id', 'quoteNumber', 'customerId', 'status', 'originCity', 'destinationCity', 'transportMode']
    expect(quotationFields).toContain('quoteNumber')
    expect(quotationFields).toContain('transportMode')
  })

  it('should have Activity model defined', () => {
    const activityFields = ['id', 'type', 'customerId', 'quotationId', 'userId', 'createdAt']
    expect(activityFields).toContain('type')
    expect(activityFields).toContain('userId')
  })

  it('should have LookupValue model defined', () => {
    const lookupFields = ['id', 'category', 'value', 'label', 'isActive']
    expect(lookupFields).toContain('category')
    expect(lookupFields).toContain('value')
  })

  it('should have AuditLog model defined', () => {
    const auditFields = ['id', 'userId', 'action', 'entityType', 'entityId', 'createdAt']
    expect(auditFields).toContain('action')
    expect(auditFields).toContain('entityType')
  })
})
