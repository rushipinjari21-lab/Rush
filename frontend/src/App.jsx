import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext.jsx'
import AppLayout from './components/layout/AppLayout.jsx'
import Login from './pages/auth/Login.jsx'
import Dashboard from './pages/dashboard/Dashboard.jsx'
import ProjectList from './pages/projects/ProjectList.jsx'
import ProjectForm from './pages/projects/ProjectForm.jsx'
import BOQList from './pages/boq/BOQList.jsx'
import BOQUpload from './pages/boq/BOQUpload.jsx'
import MBListPage from './pages/measurement/MBListPage.jsx'
import MeasurementEntrySheet from './pages/measurement/MeasurementEntrySheet.jsx'
import AbstractPage from './pages/abstract/AbstractPage.jsx'
import QuantityVariationPage from './pages/variation/QuantityVariationPage.jsx'
import RABillPage from './pages/rabill/RABillPage.jsx'
import ReportsPage from './pages/reports/ReportsPage.jsx'
import DocumentCenterPage from './pages/Documents/DocumentCenterPage.jsx'

const PrivateRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth()
  if (loading) return <div>Loading...</div>
  return isAuthenticated ? children : <Navigate to="/login" />
}

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<PrivateRoute><AppLayout /></PrivateRoute>}>
        <Route index element={<Dashboard />} />
        <Route path="projects" element={<ProjectList />} />
        <Route path="projects/new" element={<ProjectForm />} />
        <Route path="projects/edit" element={<ProjectForm />} />
        <Route path="projects/edit/*" element={<ProjectForm />} />
        <Route path="boq" element={<BOQList />} />
        <Route path="boq/upload" element={<BOQUpload />} />
        <Route path="boq/upload/*" element={<BOQUpload />} />
        <Route path="boq/*" element={<BOQList />} />
        {/* Two Dedicated Measurement Screens */}
        <Route path="measurement" element={<MBListPage />} />
        <Route path="measurement/sheet/:mbId" element={<MeasurementEntrySheet />} />
        <Route path="measurement/:mbId" element={<MeasurementEntrySheet />} />
        <Route path="abstract/:mbId" element={<AbstractPage />} />
        <Route path="variation" element={<QuantityVariationPage />} />
        <Route path="variation/:mbId" element={<QuantityVariationPage />} />
        <Route path="quantity-variation" element={<QuantityVariationPage />} />
        <Route path="quantity-variation/:mbId" element={<QuantityVariationPage />} />
        <Route path="ra-bills" element={<RABillPage />} />
        <Route path="ra-bills/*" element={<RABillPage />} />
        <Route path="documents" element={<DocumentCenterPage />} />
        <Route path="reports" element={<ReportsPage />} />
      </Route>
    </Routes>
  )
}

export default App
