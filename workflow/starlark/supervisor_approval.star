def verify_supervisor_authority(supervisor_id, student_id, supervisor_assignments):
    """
    Verify that supervisor has authority to approve the student
    
    Args:
        supervisor_id: ID of the supervisor (Dosen Pembimbing)
        student_id: ID of the student
        supervisor_assignments: List of supervisor-student assignments
    
    Returns:
        dict: Authority verification result
    """
    
    result = {
        "authorized": False,
        "reason": "",
        "assignment_details": {}
    }
    
    # Check if supervisor is assigned to this student
    for assignment in supervisor_assignments:
        if (assignment.get("supervisor_id") == supervisor_id and 
            assignment.get("student_id") == student_id):
            result["authorized"] = True
            result["assignment_details"] = assignment
            result["reason"] = "Supervisor is authorized for this student"
            return result
    
    result["reason"] = "Supervisor is not assigned to this student"
    return result


def validate_supervisor_decision(decision, admin_verification_status, previous_decisions):
    """
    Validate supervisor decision based on business rules
    
    Args:
        decision: Supervisor's decision (APPROVED or REJECTED)
        admin_verification_status: Status from Admin Verification
        previous_decisions: List of previous decisions for this internship
    
    Returns:
        dict: Validation result
    """
    
    result = {
        "valid": False,
        "reason": "",
        "warnings": []
    }
    
    # Rule 1: Admin verification must pass first
    if admin_verification_status != "ADMIN_VERIFIED":
        result["reason"] = "Cannot approve: Admin verification not passed"
        return result
    
    # Rule 2: Decision must be valid
    if decision not in ["APPROVED", "REJECTED"]:
        result["reason"] = "Invalid decision value"
        return result
    
    # Rule 3: Check for duplicate decisions
    for prev_decision in previous_decisions:
        if prev_decision.get("workflow") == "supervisor_approval":
            result["reason"] = "Decision already made for this workflow"
            return result
    
    result["valid"] = True
    result["reason"] = "Decision is valid"
    
    # Warning: Check if rejecting after admin verification passed
    if decision == "REJECTED":
        result["warnings"].append("REJECTING_AFTER_ADMIN_VERIFIED")
    
    return result


def calculate_supervisor_approval_score(admin_verification_score, document_quality, 
                                        academic_readiness, administrative_compliance):
    """
    Calculate comprehensive approval score
    
    Args:
        admin_verification_score: Score from Admin Verification (0-100)
        document_quality: Quality assessment of documents (0-10)
        academic_readiness: Academic readiness assessment (0-10)
        administrative_compliance: Administrative compliance (0-10)
    
    Returns:
        dict: Score breakdown and recommendation
    """
    
    score_breakdown = {
        "admin_verification_score": admin_verification_score,
        "document_quality_score": document_quality,
        "academic_readiness_score": academic_readiness,
        "administrative_compliance_score": administrative_compliance,
        "total_score": 0,
        "max_score": 130,
        "percentage": 0.0
    }
    
    # Calculate total score
    # Admin verification: 100 points max
    # Other factors: 10 points each
    total = admin_verification_score + document_quality + academic_readiness + administrative_compliance
    score_breakdown["total_score"] = total
    score_breakdown["percentage"] = (total / score_breakdown["max_score"]) * 100
    
    # Generate recommendation
    recommendation = {
        "decision": "",
        "confidence": "",
        "notes": ""
    }
    
    if total >= 120:
        recommendation["decision"] = "STRONG_APPROVE"
        recommendation["confidence"] = "HIGH"
        recommendation["notes"] = "Excellent candidate with all requirements met"
    elif total >= 100:
        recommendation["decision"] = "APPROVE"
        recommendation["confidence"] = "HIGH"
        recommendation["notes"] = "Good candidate with all requirements met"
    elif total >= 85:
        recommendation["decision"] = "APPROVE_WITH_CONDITIONS"
        recommendation["confidence"] = "MEDIUM"
        recommendation["notes"] = "Candidate meets minimum requirements but has some concerns"
    elif total >= 70:
        recommendation["decision"] = "REVIEW_REQUIRED"
        recommendation["confidence"] = "LOW"
        recommendation["notes"] = "Candidate needs additional review before approval"
    else:
        recommendation["decision"] = "REJECT"
        recommendation["confidence"] = "HIGH"
        recommendation["notes"] = "Candidate does not meet minimum requirements"
    
    return {
        "score_breakdown": score_breakdown,
        "recommendation": recommendation
    }


def process_supervisor_approval(input_data):
    """
    Main processing function for Supervisor Approval
    
    Args:
        input_data: Complete input data including:
            - supervisor_id
            - student_id
            - internship_id
            - admin_verification_result
            - admin_verification_score
            - document_quality
            - academic_readiness
            - administrative_compliance
            - supervisor_assignments
            - previous_decisions
            - decision (APPROVED or REJECTED)
            - rejection_reason (if rejected)
            - notes
            - approval_timestamp
            - approved_by
    
    Returns:
        dict: Complete approval processing result
    """
    
    result = {
        "approved": False,
        "status": "PENDING",
        "supervisor_authorized": False,
        "decision_valid": False,
        "score_analysis": {},
        "rejection_reasons": [],
        "warnings": [],
        "approval_details": {}
    }
    
    # 1. Verify supervisor authority
    authority_check = verify_supervisor_authority(
        input_data.get("supervisor_id", ""),
        input_data.get("student_id", ""),
        input_data.get("supervisor_assignments", [])
    )
    
    result["supervisor_authorized"] = authority_check["authorized"]
    result["approval_details"]["authority"] = authority_check
    
    if not authority_check["authorized"]:
        result["status"] = "REJECTED"
        result["rejection_reasons"].append("SUPERVISOR_NOT_AUTHORIZED")
        return result
    
    # 2. Validate decision
    decision = input_data.get("decision", "")
    admin_status = input_data.get("admin_verification_status", "")
    prev_decisions = input_data.get("previous_decisions", [])
    
    decision_validation = validate_supervisor_decision(
        decision,
        admin_status,
        prev_decisions
    )
    
    result["decision_valid"] = decision_validation["valid"]
    result["warnings"] = decision_validation["warnings"]
    
    if not decision_validation["valid"]:
        result["status"] = "REJECTED"
        result["rejection_reasons"].append("INVALID_DECISION")
        result["approval_details"]["validation_error"] = decision_validation["reason"]
        return result
    
    # 3. Calculate approval score
    score_analysis = calculate_supervisor_approval_score(
        input_data.get("admin_verification_score", 0),
        input_data.get("document_quality", 0),
        input_data.get("academic_readiness", 0),
        input_data.get("administrative_compliance", 0)
    )
    
    result["score_analysis"] = score_analysis
    
    # 4. Process decision
    if decision == "APPROVED":
        result["approved"] = True
        result["status"] = "SUPERVISOR_APPROVED"
        result["approval_details"]["decision"] = "APPROVED"
        result["approval_details"]["approved_by"] = input_data.get("approved_by", "")
        result["approval_details"]["approval_timestamp"] = input_data.get("approval_timestamp", "")
        result["approval_details"]["notes"] = input_data.get("notes", "")
        result["approval_details"]["score_analysis"] = score_analysis
        
    elif decision == "REJECTED":
        result["approved"] = False
        result["status"] = "REJECTED"
        result["rejection_reasons"].append("SUPERVISOR_REJECTED")
        result["approval_details"]["decision"] = "REJECTED"
        result["approval_details"]["rejected_by"] = input_data.get("approved_by", "")
        result["approval_details"]["rejection_timestamp"] = input_data.get("approval_timestamp", "")
        result["approval_details"]["rejection_reason"] = input_data.get("rejection_reason", "")
        result["approval_details"]["notes"] = input_data.get("notes", "")
    
    return result


def generate_approval_report(processing_result, input_data):
    """
    Generate comprehensive approval report
    
    Args:
        processing_result: Result from process_supervisor_approval
        input_data: Original input data
    
    Returns:
        dict: Complete approval report
    """
    
    report = {
        "internship_id": input_data.get("internship_id", ""),
        "student_id": input_data.get("student_id", ""),
        "supervisor_id": input_data.get("supervisor_id", ""),
        "report_timestamp": input_data.get("approval_timestamp", ""),
        
        "final_status": processing_result["status"],
        "approved": processing_result["approved"],
        
        "supervisor_authorized": processing_result["supervisor_authorized"],
        "decision_valid": processing_result["decision_valid"],
        
        "score_analysis": processing_result["score_analysis"].get("score_breakdown", {}),
        "recommendation": processing_result["score_analysis"].get("recommendation", {}),
        
        "rejection_reasons": processing_result["rejection_reasons"],
        "warnings": processing_result["warnings"],
        
        "approval_details": processing_result["approval_details"],
        
        "summary": ""
    }
    
    # Generate summary
    if processing_result["approved"]:
        score_pct = processing_result["score_analysis"].get("score_breakdown", {}).get("percentage", 0)
        report["summary"] = (
            f"Internship approved by supervisor. "
            f"Total score: {score_pct:.1f}%. "
            f"Recommendation: {processing_result['score_analysis'].get('recommendation', {}).get('decision', 'N/A')}"
        )
    else:
        reasons = ", ".join(processing_result["rejection_reasons"])
        report["summary"] = f"Internship rejected. Reasons: {reasons}"
    
    return report


# Main execution function
def execute_supervisor_approval(input_data):
    """
    Main execution function for Supervisor Approval Workflow
    
    Args:
        input_data: Complete input data for supervisor approval
    
    Returns:
        dict: Complete approval result with processing details and report
    """
    
    # Process approval
    processing_result = process_supervisor_approval(input_data)
    
    # Generate report
    report = generate_approval_report(processing_result, input_data)
    
    return {
        "processing_result": processing_result,
        "report": report
    }