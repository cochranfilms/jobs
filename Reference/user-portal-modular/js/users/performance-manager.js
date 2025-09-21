// ==================== PERFORMANCE MANAGER MODULE ====================
// Handles performance reviews, feedback, and performance-related operations

export class PerformanceManager {
    constructor(config = {}) {
        this.apiBase = config.apiBase || '';
        this.onError = config.onError || (() => {});
        this.performanceData = new Map();
        this.ratingScale = 5; // 1-5 rating scale
    }

    // ==================== PERFORMANCE DATA MANAGEMENT ====================

    async getUserPerformance(userEmail) {
        try {
            console.log('🔄 Fetching performance data for user:', userEmail);
            
            // Check cache first
            if (this.performanceData.has(userEmail)) {
                console.log('✅ Using cached performance data');
                return this.performanceData.get(userEmail);
            }
            
            // Fetch from API
            const performance = await this.fetchPerformanceFromAPI(userEmail);
            
            // Cache the data
            this.performanceData.set(userEmail, performance);
            console.log(`✅ Cached performance data for user`);
            
            return performance;
            
        } catch (error) {
            console.error('❌ Failed to get user performance:', error);
            this.onError(error, 'Performance Loading Failed');
            return null;
        }
    }

    async fetchPerformanceFromAPI(userEmail) {
        try {
            // Firestore lookup by profile.email
            if (window.FirebaseConfig && window.FirebaseConfig.isInitialized) {
                const db = window.FirebaseConfig.getFirestore();
                const snap = await db.collection('users')
                    .where('profile.email', '==', userEmail)
                    .limit(1)
                    .get();
                if (!snap.empty) {
                    const doc = snap.docs[0];
                    const user = doc.data() || {};
                    return this.extractPerformanceFromUser(doc.id, user);
                }
            }
            return null;
        } catch (error) {
            console.error('❌ API fetch failed:', error);
            throw error;
        }
    }

    extractPerformanceFromUser(name, user) {
        try {
            // Extract performance data from user object
            const performance = {
                userId: name,
                userEmail: user.profile?.email,
                overallRating: user.performance?.overallRating || null,
                lastReviewDate: user.performance?.lastReviewDate || null,
                nextReviewDate: user.performance?.nextReviewDate || null,
                totalReviews: user.performance?.totalReviews || 0,
                reviews: user.performance?.reviews || [],
                strengths: user.performance?.strengths || [],
                areasForImprovement: user.performance?.areasForImprovement || [],
                goals: user.performance?.goals || [],
                achievements: user.performance?.achievements || [],
                feedback: user.performance?.feedback || [],
                metrics: user.performance?.metrics || {},
                status: user.performance?.status || 'pending',
                reviewer: user.performance?.reviewer || 'System',
                notes: user.performance?.notes || '',
                createdAt: user.performance?.createdAt || new Date().toISOString(),
                updatedAt: user.performance?.updatedAt || new Date().toISOString()
            };
            
            // Generate default performance data if none exists
            if (!user.performance) {
                performance.overallRating = this.calculateDefaultRating(user);
                performance.strengths = this.generateDefaultStrengths(user);
                performance.areasForImprovement = this.generateDefaultAreasForImprovement(user);
                performance.goals = this.generateDefaultGoals(user);
                performance.achievements = this.generateDefaultAchievements(user);
                performance.metrics = this.generateDefaultMetrics(user);
            }
            
            return performance;
            
        } catch (error) {
            console.error('❌ Failed to extract performance from user:', error);
            return null;
        }
    }

    // ==================== PERFORMANCE CALCULATION ====================

    calculateDefaultRating(user) {
        try {
            // Calculate a default rating based on user data
            let rating = 3; // Base rating
            
            // Adjust based on contract status
            if (user.contract?.contractStatus === 'active') {
                rating += 0.5;
            }
            
            // Adjust based on job completion
            if (user.jobs) {
                const completedJobs = Object.values(user.jobs).filter(job => job.status === 'completed').length;
                const totalJobs = Object.keys(user.jobs).length;
                
                if (totalJobs > 0) {
                    const completionRate = completedJobs / totalJobs;
                    if (completionRate >= 0.8) rating += 0.5;
                    if (completionRate >= 0.9) rating += 0.5;
                }
            }
            
            // Adjust based on approval date (longer tenure = higher rating)
            if (user.profile?.approvedDate) {
                const approved = new Date(user.profile.approvedDate);
                const now = new Date();
                const monthsSinceApproval = (now - approved) / (1000 * 60 * 60 * 24 * 30);
                
                if (monthsSinceApproval >= 6) rating += 0.5;
                if (monthsSinceApproval >= 12) rating += 0.5;
            }
            
            // Ensure rating is within bounds
            return Math.min(Math.max(rating, 1), this.ratingScale);
            
        } catch (error) {
            console.warn('⚠️ Failed to calculate default rating:', error);
            return 3;
        }
    }

    generateDefaultStrengths(user) {
        try {
            const strengths = [];
            
            // Add role-based strengths
            if (user.profile?.role) {
                const roleStrengths = {
                    'Photographer': ['Creative vision', 'Technical expertise', 'Attention to detail'],
                    'Videographer': ['Storytelling ability', 'Technical skills', 'Creative direction'],
                    'Editor': ['Technical proficiency', 'Creative vision', 'Attention to detail'],
                    'Director': ['Leadership', 'Creative vision', 'Communication skills'],
                    'Producer': ['Organization', 'Communication', 'Problem-solving'],
                    'Creator': ['Creativity', 'Adaptability', 'Technical skills']
                };
                
                const role = user.profile.role.toLowerCase();
                for (const [key, value] of Object.entries(roleStrengths)) {
                    if (key.toLowerCase().includes(role) || role.includes(key.toLowerCase())) {
                        strengths.push(...value);
                        break;
                    }
                }
            }
            
            // Add general strengths
            if (user.contract?.contractStatus === 'active') {
                strengths.push('Reliability', 'Professionalism');
            }
            
            if (user.profile?.approvedDate) {
                strengths.push('Experience', 'Commitment');
            }
            
            // Ensure unique strengths
            return [...new Set(strengths)];
            
        } catch (error) {
            console.warn('⚠️ Failed to generate default strengths:', error);
            return ['Professionalism', 'Reliability'];
        }
    }

    generateDefaultAreasForImprovement(user) {
        try {
            const areas = [];
            
            // Add role-based improvement areas
            if (user.profile?.role) {
                const roleAreas = {
                    'Photographer': ['Time management', 'Client communication'],
                    'Videographer': ['Project planning', 'Equipment maintenance'],
                    'Editor': ['Workflow optimization', 'Client feedback integration'],
                    'Director': ['Team management', 'Budget awareness'],
                    'Producer': ['Risk management', 'Timeline optimization'],
                    'Creator': ['Project scope definition', 'Client expectation management']
                };
                
                const role = user.profile.role.toLowerCase();
                for (const [key, value] of Object.entries(roleAreas)) {
                    if (key.toLowerCase().includes(role) || role.includes(key.toLowerCase())) {
                        areas.push(...value);
                        break;
                    }
                }
            }
            
            // Add general improvement areas
            areas.push('Professional development', 'Skill enhancement');
            
            // Ensure unique areas
            return [...new Set(areas)];
            
        } catch (error) {
            console.warn('⚠️ Failed to generate default improvement areas:', error);
            return ['Professional development', 'Skill enhancement'];
        }
    }

    generateDefaultGoals(user) {
        try {
            const goals = [];
            
            // Add role-based goals
            if (user.profile?.role) {
                const roleGoals = {
                    'Photographer': ['Expand portfolio', 'Master new techniques', 'Build client base'],
                    'Videographer': ['Develop storytelling skills', 'Learn new equipment', 'Create signature style'],
                    'Editor': ['Improve workflow efficiency', 'Master new software', 'Develop creative style'],
                    'Director': ['Build team leadership', 'Develop unique vision', 'Expand project scope'],
                    'Producer': ['Improve project management', 'Enhance communication', 'Optimize processes'],
                    'Creator': ['Develop unique style', 'Expand skill set', 'Build professional network']
                };
                
                const role = user.profile.role.toLowerCase();
                for (const [key, value] of Object.entries(roleGoals)) {
                    if (key.toLowerCase().includes(role) || role.includes(key.toLowerCase())) {
                        goals.push(...value);
                        break;
                    }
                }
            }
            
            // Add general goals
            goals.push('Professional growth', 'Skill development', 'Industry recognition');
            
            // Ensure unique goals
            return [...new Set(goals)];
            
        } catch (error) {
            console.warn('⚠️ Failed to generate default goals:', error);
            return ['Professional growth', 'Skill development'];
        }
    }

    generateDefaultAchievements(user) {
        try {
            const achievements = [];
            
            // Add role-based achievements
            if (user.profile?.role) {
                achievements.push(`Successfully onboarded as ${user.profile.role}`);
            }
            
            if (user.contract?.contractStatus === 'active') {
                achievements.push('Contract activated and maintained');
            }
            
            if (user.profile?.approvedDate) {
                achievements.push('Profile approved and verified');
            }
            
            // Add general achievements
            achievements.push('Professional profile established', 'System access granted');
            
            return achievements;
            
        } catch (error) {
            console.warn('⚠️ Failed to generate default achievements:', error);
            return ['Professional profile established'];
        }
    }

    generateDefaultMetrics(user) {
        try {
            const metrics = {
                reliability: this.calculateReliabilityScore(user),
                quality: this.calculateQualityScore(user),
                communication: this.calculateCommunicationScore(user),
                timeliness: this.calculateTimelinessScore(user),
                professionalism: this.calculateProfessionalismScore(user)
            };
            
            return metrics;
            
        } catch (error) {
            console.warn('⚠️ Failed to generate default metrics:', error);
            return {
                reliability: 3,
                quality: 3,
                communication: 3,
                timeliness: 3,
                professionalism: 3
            };
        }
    }

    calculateReliabilityScore(user) {
        try {
            let score = 3;
            
            if (user.contract?.contractStatus === 'active') score += 1;
            if (user.profile?.approvedDate) score += 0.5;
            
            return Math.min(Math.max(score, 1), this.ratingScale);
        } catch (error) {
            return 3;
        }
    }

    calculateQualityScore(user) {
        try {
            let score = 3;
            
            if (user.profile?.role) score += 0.5;
            if (user.profile?.description) score += 0.5;
            
            return Math.min(Math.max(score, 1), this.ratingScale);
        } catch (error) {
            return 3;
        }
    }

    calculateCommunicationScore(user) {
        try {
            let score = 3;
            
            if (user.profile?.email) score += 0.5;
            if (user.contract?.contractStatus === 'active') score += 0.5;
            
            return Math.min(Math.max(score, 1), this.ratingScale);
        } catch (error) {
            return 3;
        }
    }

    calculateTimelinessScore(user) {
        try {
            let score = 3;
            
            if (user.profile?.approvedDate) score += 0.5;
            if (user.contract?.contractStatus === 'active') score += 0.5;
            
            return Math.min(Math.max(score, 1), this.ratingScale);
        } catch (error) {
            return 3;
        }
    }

    calculateProfessionalismScore(user) {
        try {
            let score = 3;
            
            if (user.profile?.role) score += 0.5;
            if (user.profile?.location) score += 0.5;
            
            return Math.min(Math.max(score, 1), this.ratingScale);
        } catch (error) {
            return 3;
        }
    }

    // ==================== PERFORMANCE REVIEWS ====================

    async addPerformanceReview(userEmail, reviewData) {
        try {
            console.log('🔄 Adding performance review for user:', userEmail);
            
            // Validate review data
            this.validateReviewData(reviewData);
            
            // Get current performance data
            const performance = await this.getUserPerformance(userEmail);
            if (!performance) {
                throw new Error('Performance data not found');
            }
            
            // Add new review
            const newReview = {
                id: `review-${Date.now()}`,
                rating: reviewData.rating,
                feedback: reviewData.feedback,
                strengths: reviewData.strengths || [],
                areasForImprovement: reviewData.areasForImprovement || [],
                goals: reviewData.goals || [],
                achievements: reviewData.achievements || [],
                reviewer: reviewData.reviewer || 'System',
                reviewDate: new Date().toISOString(),
                notes: reviewData.notes || ''
            };
            
            // Update performance data
            performance.reviews.push(newReview);
            performance.totalReviews = performance.reviews.length;
            performance.lastReviewDate = newReview.reviewDate;
            performance.overallRating = this.calculateOverallRating(performance.reviews);
            performance.updatedAt = new Date().toISOString();
            
            // Update cache
            this.performanceData.set(userEmail, performance);
            
            console.log('✅ Performance review added successfully');
            return performance;
            
        } catch (error) {
            console.error('❌ Failed to add performance review:', error);
            this.onError(error, 'Performance Review Failed');
            throw error;
        }
    }

    calculateOverallRating(reviews) {
        try {
            if (!reviews || reviews.length === 0) return null;
            
            const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
            const averageRating = totalRating / reviews.length;
            
            return Math.round(averageRating * 10) / 10; // Round to 1 decimal place
            
        } catch (error) {
            console.warn('⚠️ Failed to calculate overall rating:', error);
            return null;
        }
    }

    validateReviewData(reviewData) {
        try {
            const required = ['rating', 'feedback'];
            const missing = required.filter(field => !reviewData[field]);
            
            if (missing.length > 0) {
                throw new Error(`Missing required review fields: ${missing.join(', ')}`);
            }
            
            // Validate rating
            if (reviewData.rating < 1 || reviewData.rating > this.ratingScale) {
                throw new Error(`Rating must be between 1 and ${this.ratingScale}`);
            }
            
            // Validate feedback
            if (typeof reviewData.feedback !== 'string' || reviewData.feedback.trim().length < 10) {
                throw new Error('Feedback must be at least 10 characters long');
            }
            
            return true;
            
        } catch (error) {
            console.error('❌ Review validation failed:', error);
            throw error;
        }
    }

    // ==================== PERFORMANCE ANALYTICS ====================

    async getPerformanceAnalytics(userEmail) {
        try {
            const performance = await this.getUserPerformance(userEmail);
            if (!performance) return null;
            
            const analytics = {
                currentRating: performance.overallRating,
                ratingTrend: this.calculateRatingTrend(performance.reviews),
                improvementAreas: this.identifyImprovementAreas(performance),
                strengthGrowth: this.analyzeStrengthGrowth(performance),
                goalProgress: this.analyzeGoalProgress(performance),
                reviewFrequency: this.calculateReviewFrequency(performance),
                performanceScore: this.calculatePerformanceScore(performance)
            };
            
            return analytics;
            
        } catch (error) {
            console.error('❌ Failed to get performance analytics:', error);
            this.onError(error, 'Performance Analytics Failed');
            return null;
        }
    }

    calculateRatingTrend(reviews) {
        try {
            if (!reviews || reviews.length < 2) return 'stable';
            
            const sortedReviews = reviews.sort((a, b) => new Date(a.reviewDate) - new Date(b.reviewDate));
            const firstRating = sortedReviews[0].rating;
            const lastRating = sortedReviews[sortedReviews.length - 1].rating;
            
            const difference = lastRating - firstRating;
            
            if (difference > 0.5) return 'improving';
            if (difference < -0.5) return 'declining';
            return 'stable';
            
        } catch (error) {
            console.warn('⚠️ Failed to calculate rating trend:', error);
            return 'stable';
        }
    }

    identifyImprovementAreas(performance) {
        try {
            const areas = [];
            
            // Analyze metrics for areas below threshold
            const threshold = 3;
            for (const [metric, score] of Object.entries(performance.metrics || {})) {
                if (score < threshold) {
                    areas.push({
                        metric: metric,
                        currentScore: score,
                        targetScore: threshold,
                        priority: threshold - score
                    });
                }
            }
            
            // Sort by priority (highest first)
            return areas.sort((a, b) => b.priority - a.priority);
            
        } catch (error) {
            console.warn('⚠️ Failed to identify improvement areas:', error);
            return [];
        }
    }

    analyzeStrengthGrowth(performance) {
        try {
            if (!performance.reviews || performance.reviews.length < 2) {
                return { growth: 'insufficient data', strengths: performance.strengths || [] };
            }
            
            // Analyze how strengths have evolved over time
            const recentStrengths = performance.reviews[performance.reviews.length - 1].strengths || [];
            const originalStrengths = performance.strengths || [];
            
            const newStrengths = recentStrengths.filter(strength => !originalStrengths.includes(strength));
            const maintainedStrengths = recentStrengths.filter(strength => originalStrengths.includes(strength));
            
            return {
                growth: newStrengths.length > 0 ? 'growing' : 'stable',
                newStrengths: newStrengths,
                maintainedStrengths: maintainedStrengths,
                totalStrengths: recentStrengths.length
            };
            
        } catch (error) {
            console.warn('⚠️ Failed to analyze strength growth:', error);
            return { growth: 'unknown', strengths: [] };
        }
    }

    analyzeGoalProgress(performance) {
        try {
            if (!performance.goals || performance.goals.length === 0) {
                return { progress: 'no goals set', completed: 0, total: 0 };
            }
            
            const totalGoals = performance.goals.length;
            const completedGoals = performance.achievements.filter(achievement => 
                performance.goals.some(goal => achievement.toLowerCase().includes(goal.toLowerCase()))
            ).length;
            
            const progressPercentage = (completedGoals / totalGoals) * 100;
            
            return {
                progress: progressPercentage >= 80 ? 'excellent' : 
                         progressPercentage >= 60 ? 'good' : 
                         progressPercentage >= 40 ? 'fair' : 'needs improvement',
                completed: completedGoals,
                total: totalGoals,
                percentage: Math.round(progressPercentage)
            };
            
        } catch (error) {
            console.warn('⚠️ Failed to analyze goal progress:', error);
            return { progress: 'unknown', completed: 0, total: 0 };
        }
    }

    calculateReviewFrequency(performance) {
        try {
            if (!performance.reviews || performance.reviews.length < 2) {
                return 'insufficient data';
            }
            
            const sortedReviews = performance.reviews.sort((a, b) => new Date(a.reviewDate) - new Date(b.reviewDate));
            const totalDays = (new Date(sortedReviews[sortedReviews.length - 1].reviewDate) - new Date(sortedReviews[0].reviewDate)) / (1000 * 60 * 60 * 24);
            const averageDaysBetweenReviews = totalDays / (sortedReviews.length - 1);
            
            if (averageDaysBetweenReviews <= 30) return 'monthly';
            if (averageDaysBetweenReviews <= 90) return 'quarterly';
            if (averageDaysBetweenReviews <= 180) return 'semi-annually';
            return 'annually';
            
        } catch (error) {
            console.warn('⚠️ Failed to calculate review frequency:', error);
            return 'unknown';
        }
    }

    calculatePerformanceScore(performance) {
        try {
            let score = 0;
            let maxScore = 0;
            
            // Rating component (40% weight)
            if (performance.overallRating) {
                score += (performance.overallRating / this.ratingScale) * 40;
                maxScore += 40;
            }
            
            // Metrics component (30% weight)
            if (performance.metrics) {
                const metricsScore = Object.values(performance.metrics).reduce((sum, metric) => sum + metric, 0);
                const maxMetricsScore = Object.keys(performance.metrics).length * this.ratingScale;
                score += (metricsScore / maxMetricsScore) * 30;
                maxScore += 30;
            }
            
            // Goals component (20% weight)
            if (performance.goals && performance.goals.length > 0) {
                const goalProgress = this.analyzeGoalProgress(performance);
                score += (goalProgress.percentage / 100) * 20;
                maxScore += 20;
            }
            
            // Reviews component (10% weight)
            if (performance.totalReviews > 0) {
                score += Math.min(performance.totalReviews / 10, 1) * 10;
                maxScore += 10;
            }
            
            if (maxScore === 0) return null;
            
            return Math.round((score / maxScore) * 100);
            
        } catch (error) {
            console.warn('⚠️ Failed to calculate performance score:', error);
            return null;
        }
    }

    // ==================== PUBLIC API ====================

    getPerformance(userEmail) {
        try {
            return this.performanceData.get(userEmail);
        } catch (error) {
            console.warn('⚠️ Failed to get performance:', error);
            return null;
        }
    }

    clearCache() {
        try {
            this.performanceData.clear();
            console.log('✅ Performance cache cleared');
        } catch (error) {
            console.warn('⚠️ Failed to clear performance cache:', error);
        }
    }

    // ==================== STATIC UTILITIES ====================

    static formatRating(rating) {
        try {
            if (!rating) return 'Not rated';
            
            const stars = '★'.repeat(Math.floor(rating)) + '☆'.repeat(this.ratingScale - Math.floor(rating));
            return `${stars} (${rating}/${this.ratingScale})`;
            
        } catch (error) {
            return 'Rating unavailable';
        }
    }

    static formatReviewDate(dateString) {
        try {
            if (!dateString) return 'Not specified';
            
            const date = new Date(dateString);
            if (isNaN(date.getTime())) {
                return 'Invalid date';
            }
            
            return date.toLocaleDateString();
            
        } catch (error) {
            return 'Invalid date';
        }
    }
}

// ==================== DEFAULT EXPORT ====================

export default PerformanceManager;
