<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\AdminController;
use App\Http\Controllers\DocenteController;
use App\Http\Controllers\EstudianteController;
use App\Http\Controllers\ReportController;

/*
|--------------------------------------------------------------------------
| API Routes - FICCT CUP UAGRM
|--------------------------------------------------------------------------
*/

Route::prefix('v1')->group(function () {
    
    // Public authentication route
    Route::post('/auth/login', [AuthController::class, 'login']);

    // Protected API routes
    Route::middleware('auth:sanctum')->group(function () {
        
        // General Profile route
        Route::get('/auth/user', [AuthController::class, 'me']);
        Route::post('/auth/logout', [AuthController::class, 'logout']);

        // STUDENT ENDPOINTS
        Route::prefix('estudiante')->group(function () {
            Route::get('/profile', [EstudianteController::class, 'getProfile']);
            Route::post('/pago/upload', [EstudianteController::class, 'uploadVoucher']);
            Route::post('/documentos/update', [EstudianteController::class, 'updateDocuments']);
        });

        // TEACHER ENDPOINTS
        Route::prefix('docente')->group(function () {
            Route::get('/grupos', [DocenteController::class, 'getMyGroups']);
            Route::get('/grupo/{id}/students', [DocenteController::class, 'getGroupStudents']);
            Route::post('/grades/save', [DocenteController::class, 'saveGrades']);
        });

        // ADMINISTRATOR ENDPOINTS
        Route::prefix('admin')->group(function () {
            // General Settings and Stats
            Route::get('/dashboard-stats', [AdminController::class, 'getStats']);
            Route::get('/logs', [AdminController::class, 'getAuditLogs']);
            
            // Career / Allocation quotas config
            Route::post('/carreras/{id}/quota', [AdminController::class, 'updateCareerQuota']);
            
            // Payment Approvals / Physical Voucher verification
            Route::get('/pagos/pending', [AdminController::class, 'getPendingPayments']);
            Route::post('/pagos/{id}/verify', [AdminController::class, 'verifyPayment']);

            // Admission closing & Cupos enforcement
            Route::post('/admission/close-period', [AdminController::class, 'closePeriodAndAwardCupos']);
        });

        // GENERAL REPORTS & RANKINGS
        Route::get('/reports/statistics', [ReportController::class, 'getOverallStatistics']);
        Route::get('/reports/group-rankings', [ReportController::class, 'getCoursePerformanceRankings']);
    });
});
