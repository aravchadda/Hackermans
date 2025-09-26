// Sample data for testing GraphicWalker
export const sampleDataSource = [
    { name: 'John Doe', age: 28, department: 'Engineering', salary: 75000, experience: 3 },
    { name: 'Jane Smith', age: 32, department: 'Marketing', salary: 68000, experience: 5 },
    { name: 'Bob Johnson', age: 45, department: 'Engineering', salary: 95000, experience: 12 },
    { name: 'Alice Brown', age: 29, department: 'Sales', salary: 62000, experience: 2 },
    { name: 'Charlie Wilson', age: 38, department: 'Engineering', salary: 82000, experience: 8 },
    { name: 'Diana Lee', age: 31, department: 'Marketing', salary: 71000, experience: 4 },
    { name: 'Eve Davis', age: 42, department: 'Sales', salary: 78000, experience: 10 },
    { name: 'Frank Miller', age: 35, department: 'Engineering', salary: 88000, experience: 7 },
    { name: 'Grace Taylor', age: 27, department: 'Marketing', salary: 59000, experience: 1 },
    { name: 'Henry Anderson', age: 40, department: 'Sales', salary: 85000, experience: 9 }
];

export const sampleFields = [
    { name: 'name', type: 'nominal', description: 'Employee Name' },
    { name: 'age', type: 'quantitative', description: 'Age in years' },
    { name: 'department', type: 'nominal', description: 'Department' },
    { name: 'salary', type: 'quantitative', description: 'Annual Salary' },
    { name: 'experience', type: 'quantitative', description: 'Years of Experience' }
];

// Shipment data fields from CSV
export const shipmentFields = [
    { name: 'GrossQuantity', type: 'quantitative', description: 'Gross quantity of items shipped' },
    { name: 'FlowRate', type: 'quantitative', description: 'Flow rate measurement for shipment processing' },
    { name: 'ShipmentCompartmentID', type: 'nominal', description: 'Unique identifier for shipment compartment' },
    { name: 'BaseProductID', type: 'nominal', description: 'Unique identifier for base product' },
    { name: 'BaseProductCode', type: 'nominal', description: 'Product code identifier' },
    { name: 'ShipmentID', type: 'nominal', description: 'Unique identifier for shipment' },
    { name: 'ShipmentCode', type: 'nominal', description: 'Shipment code identifier' },
    { name: 'ExitTime', type: 'temporal', description: 'Timestamp when shipment exited the system' },
    { name: 'BayCode', type: 'nominal', description: 'Bay identifier where shipment was processed' },
    { name: 'ScheduledDate', type: 'temporal', description: 'Scheduled date for shipment processing' },
    { name: 'CreatedTime', type: 'temporal', description: 'Timestamp when shipment record was created' }
];
